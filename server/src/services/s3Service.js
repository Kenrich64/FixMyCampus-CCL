import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET_NAME || '';
const useAws = process.env.USE_AWS_SERVICES === 'true';

// AWS S3 client initialized using EC2 IAM Role credentials automatically
// Never hardcode access keys!
const s3Client = useAws ? new S3Client({ region }) : null;

// Allowed MIME types and max size (5 MB)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Generate Presigned Upload URL (PUT)
 * Server determines the secure key. Client cannot specify arbitrary paths.
 */
export async function getPresignedUploadUrl({ studentId, fileType, fileSize }) {
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new Error(`Invalid file type: ${fileType}. Allowed formats: JPG, PNG, WEBP.`);
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit. Received: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);
  }

  const extension = fileType.split('/')[1] === 'jpeg' ? 'jpg' : fileType.split('/')[1];
  const uniqueKey = `evidence/student-${studentId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

  if (!useAws || !bucketName) {
    // Local Development Mock Adapter
    // Note: This returns a local mock upload URL for development testing
    return {
      uploadUrl: `http://localhost:${process.env.PORT || 5000}/api/uploads/local-mock-upload?key=${encodeURIComponent(uniqueKey)}`,
      s3Key: uniqueKey,
      expiresIn: 900,
      isLocalAdapter: true
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    s3Key: uniqueKey,
    expiresIn: 900,
    isLocalAdapter: false
  };
}

/**
 * Generate Presigned Download URL (GET)
 * Allows authorized users to securely view private complaint evidence.
 */
export async function getPresignedDownloadUrl(s3Key) {
  if (!s3Key) return null;

  if (!useAws || !bucketName) {
    // Local Development Adapter
    return `http://localhost:${process.env.PORT || 5000}/api/uploads/local-mock-view?key=${encodeURIComponent(s3Key)}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 1800 }); // 30 min
}

/**
 * Verify S3 Object Exists Before Attaching to Complaint
 */
export async function verifyObjectExists(s3Key) {
  if (!s3Key) return false;

  if (!useAws || !bucketName) {
    // In local mode, verify against local session or simulated storage
    return true;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`S3 HeadObject verification failed for key ${s3Key}:`, error.message);
    return false;
  }
}
