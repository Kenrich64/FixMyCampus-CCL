import { getPresignedUploadUrl, verifyObjectExists, getPresignedDownloadUrl } from '../services/s3Service.js';
import { query, withTransaction } from '../config/db.js';

// Local in-memory mock store for local dev image uploads
const localMockStorage = new Map();

/**
 * Generate Presigned Upload URL for Complaint Evidence
 */
export async function createUploadPresignedUrl(req, res, next) {
  try {
    const { fileType, fileSize } = req.body;
    const studentId = req.user.id;

    if (!fileType) {
      return res.status(400).json({ success: false, error: 'fileType is required (e.g. image/jpeg, image/png).' });
    }

    const result = await getPresignedUploadUrl({ studentId, fileType, fileSize });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirm Upload and Attach S3 Evidence to Complaint
 */
export async function confirmUpload(req, res, next) {
  try {
    const { complaintId, s3Key } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userName = req.user.name;

    if (!complaintId || !s3Key || typeof s3Key !== 'string') {
      return res.status(400).json({ success: false, error: 'complaintId and valid s3Key are required.' });
    }

    // Strict namespace boundary: Prevent student from attaching another student's evidence or directory traversal
    const expectedPrefix = `evidence/student-${userId}/`;
    if (userRole === 'student' && (!s3Key.startsWith(expectedPrefix) || s3Key.includes('..'))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You cannot attach evidence outside your student upload namespace.'
      });
    }

    // Verify complaint ownership & existence
    const compRes = await query('SELECT id, student_id, reference_number FROM complaints WHERE id = $1', [complaintId]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    // Authorization check
    if (userRole === 'student' && complaint.student_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You can only attach evidence to your own complaints.' });
    }

    // Verify object exists in S3 (or mock storage)
    const exists = await verifyObjectExists(s3Key);
    if (!exists) {
      return res.status(400).json({
        success: false,
        error: 'S3 verification failed: Uploaded file was not found in bucket. Please re-upload.'
      });
    }

    // Save evidence key in database transaction
    await withTransaction(async (client) => {
      await client.query(
        'UPDATE complaints SET evidence_s3_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [s3Key, complaintId]
      );

      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          complaintId,
          userId,
          userName,
          'evidence_uploaded',
          null,
          s3Key,
          'Evidence photograph attached to complaint.'
        ]
      );
    });

    const downloadUrl = await getPresignedDownloadUrl(s3Key);

    res.json({
      success: true,
      message: 'Evidence attached successfully.',
      s3Key,
      evidenceUrl: downloadUrl
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Local Development Mock Upload Endpoint
 */
export async function handleLocalMockUpload(req, res) {
  const key = req.query.key;
  localMockStorage.set(key, true);
  res.status(200).send('Local upload simulation successful.');
}

/**
 * Local Development Mock View Endpoint
 */
export async function handleLocalMockView(req, res) {
  // Returns a clean SVG representation of uploaded evidence photo
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#f1f5f9"/>
      <rect x="20" y="20" width="560" height="360" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="300" cy="160" r="48" fill="#e2e8f0"/>
      <path d="M280 160 L300 140 L320 160 M300 140 L300 180" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
      <text x="300" y="240" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#1e293b" text-anchor="middle">
        Complaint Evidence Photograph [Local Dev Mock]
      </text>
      <text x="300" y="270" font-family="system-ui, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">
        Target S3 Key: ${req.query.key || 'unknown'}
      </text>
      <text x="300" y="300" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">
        (In AWS production, this serves presigned S3 object URL directly from private bucket)
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
}
