import dotenv from 'dotenv';
import { pollNotificationJobs, deleteNotificationJob } from '../services/sqsService.js';
import { publishCampusAlert } from '../services/snsService.js';
import { loadParameterStoreConfig } from '../services/ssmService.js';

dotenv.config();

let isRunning = true;

async function initWorker() {
  if (process.env.USE_AWS_SERVICES === 'true') {
    console.log('[Worker Startup] Fetching configuration from Parameter Store...');
    await loadParameterStoreConfig();
  }

  console.log('----------------------------------------------------');
  console.log('🚀 FixMyCampus Asynchronous Notification Worker Started');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`AWS Services Enabled: ${process.env.USE_AWS_SERVICES === 'true'}`);
  console.log('Polling SQS queue for maintenance notification tasks...');
  console.log('----------------------------------------------------');

  startWorkerLoop();
}

async function processMessage(message) {
  try {
    const jobData = JSON.parse(message.Body);
    console.log(`[Worker] Processing notification task for ${jobData.referenceNumber} (${jobData.eventType})`);

    // Publish to SNS
    await publishCampusAlert(jobData);

    // Delete message from SQS on successful delivery
    await deleteNotificationJob(message.ReceiptHandle);
    console.log(`[Worker] Successfully processed and deleted message for ${jobData.referenceNumber}`);
  } catch (error) {
    console.error(`[Worker ERROR] Failed to process message:`, error.message);
    // Message is NOT deleted here so it returns to SQS after visibility timeout for retry
  }
}

async function startWorkerLoop() {
  while (isRunning) {
    try {
      // Long-polling: waits up to 10 seconds for messages if AWS SQS is configured
      const messages = await pollNotificationJobs(5, 10);

      if (messages && messages.length > 0) {
        console.log(`[Worker] Received ${messages.length} message(s) to process.`);
        for (const message of messages) {
          await processMessage(message);
        }
      } else {
        // In local mode without messages, pause briefly before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (err) {
      console.error('[Worker Loop Exception]:', err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Worker] Gracefully stopping notification worker...');
  isRunning = false;
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] Received SIGTERM. Shutting down worker...');
  isRunning = false;
  setTimeout(() => process.exit(0), 1000);
});

initWorker();
