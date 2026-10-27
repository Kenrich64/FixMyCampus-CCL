import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const topicArn = process.env.SNS_TOPIC_ARN || '';
const useAws = process.env.USE_AWS_SERVICES === 'true';

// SNS client using EC2 IAM Role credentials (no hardcoded keys)
const snsClient = useAws ? new SNSClient({ region }) : null;

/**
 * Format notification subject and body based on event type
 */
function buildNotificationPayload(jobData) {
  const { referenceNumber, title, status, priority, eventType, actorName, note, recipientName } = jobData;

  let eventSummary = 'Update';
  if (eventType === 'submitted') eventSummary = 'New Complaint Registered';
  else if (eventType === 'status_changed') eventSummary = `Status Changed to ${status.toUpperCase()}`;
  else if (eventType === 'priority_changed') eventSummary = `Priority Changed to ${priority.toUpperCase()}`;
  else if (eventType === 'assigned') eventSummary = `Assigned for Resolution`;
  else if (eventType === 'note_added') eventSummary = `Resolution Note Added`;

  const subject = `[FixMyCampus] ${eventSummary} - ${referenceNumber}`;

  const message = [
    `FixMyCampus Maintenance Alert`,
    `=====================================`,
    `Reference: ${referenceNumber}`,
    `Title:     ${title}`,
    `Status:    ${status.toUpperCase()}`,
    `Priority:  ${priority.toUpperCase()}`,
    `Action by: ${actorName || 'System'}`,
    `Recipient: ${recipientName || 'Campus Community'}`,
    note ? `\nDetails/Notes:\n${note}` : '',
    `\nView progress on FixMyCampus portal.`,
    `=====================================`
  ].filter(Boolean).join('\n');

  return { subject, message };
}

/**
 * Publish alert to SNS topic
 */
export async function publishCampusAlert(jobData) {
  const { subject, message } = buildNotificationPayload(jobData);

  if (!useAws || !topicArn) {
    // Local development mock adapter
    console.log(`\n================== [LOCAL DEV NOTIFICATION ADAPTER] ==================`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${message}`);
    console.log(`NOTE: Local simulation only. To deliver real SNS emails, configure SNS_TOPIC_ARN and set USE_AWS_SERVICES=true on EC2.`);
    console.log(`=======================================================================\n`);
    return {
      success: true,
      messageId: `mock-sns-${Date.now()}`,
      isLocalAdapter: true
    };
  }

  try {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: subject.slice(0, 100), // SNS subject max length 100
      Message: message
    });

    const response = await snsClient.send(command);
    console.log(`[AWS SNS] Successfully published alert ${response.MessageId} to topic ${topicArn}`);
    return {
      success: true,
      messageId: response.MessageId,
      isLocalAdapter: false
    };
  } catch (error) {
    console.error(`[AWS SNS ERROR] Failed to publish alert:`, error.message);
    throw error;
  }
}
