import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.SQS_QUEUE_URL || '';
const useAws = process.env.USE_AWS_SERVICES === 'true';

// SQS client using EC2 IAM Role credentials (no hardcoded keys!)
const sqsClient = useAws ? new SQSClient({ region }) : null;

// In-memory queue for local development testing when AWS is disabled
const localInMemoryQueue = [];

/**
 * Publish a notification job message to SQS
 */
export async function enqueueNotificationJob(jobData) {
  const sanitizedMessage = {
    complaintId: jobData.complaintId,
    referenceNumber: jobData.referenceNumber,
    title: jobData.title,
    category: jobData.category,
    priority: jobData.priority,
    status: jobData.status,
    eventType: jobData.eventType,
    timestamp: jobData.timestamp || new Date().toISOString(),
    recipientEmail: jobData.recipientEmail,
    recipientName: jobData.recipientName,
    actorName: jobData.actorName,
    note: jobData.note || ''
  };

  if (!useAws || !queueUrl) {
    // Local Development Adapter
    console.log(`[LOCAL DEV SQS ADAPTER] Queued notification for [${sanitizedMessage.referenceNumber}] (${sanitizedMessage.eventType} -> ${sanitizedMessage.status})`);
    localInMemoryQueue.push({
      ReceiptHandle: `local-${Date.now()}-${Math.random()}`,
      Body: JSON.stringify(sanitizedMessage)
    });
    return { success: true, messageId: `mock-msg-${Date.now()}`, isLocalAdapter: true };
  }

  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(sanitizedMessage),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: sanitizedMessage.eventType
        },
        ReferenceNumber: {
          DataType: 'String',
          StringValue: sanitizedMessage.referenceNumber
        }
      }
    });

    const response = await sqsClient.send(command);
    console.log(`[AWS SQS] Enqueued message ${response.MessageId} for complaint ${sanitizedMessage.referenceNumber}`);
    return { success: true, messageId: response.MessageId, isLocalAdapter: false };
  } catch (error) {
    // Crucial requirement: Queue failure must never fail the saved complaint!
    console.error(`[AWS SQS ERROR] Failed to send message to SQS:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Poll SQS messages (Used by the background notification worker)
 */
export async function pollNotificationJobs(maxMessages = 5, waitTimeSeconds = 10) {
  if (!useAws || !queueUrl) {
    // Local mock queue consumer
    if (localInMemoryQueue.length > 0) {
      const messages = localInMemoryQueue.splice(0, maxMessages);
      return messages.map(msg => ({
        ReceiptHandle: msg.ReceiptHandle,
        Body: msg.Body,
        isLocal: true
      }));
    }
    return [];
  }

  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds, // Long polling
      VisibilityTimeout: 30
    });

    const response = await sqsClient.send(command);
    return response.Messages || [];
  } catch (error) {
    console.error(`[AWS SQS POLL ERROR]:`, error.message);
    return [];
  }
}

/**
 * Delete SQS message after successful processing
 */
export async function deleteNotificationJob(receiptHandle) {
  if (!useAws || !queueUrl) {
    // Local adapter no-op
    return { success: true, isLocalAdapter: true };
  }

  try {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    });
    await sqsClient.send(command);
    return { success: true };
  } catch (error) {
    console.error(`[AWS SQS DELETE ERROR]:`, error.message);
    throw error;
  }
}
