import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const useAws = process.env.USE_AWS_SERVICES === 'true';
const logGroup = process.env.CLOUDWATCH_APP_LOG_GROUP || '/fixmycampus/app';

const cwClient = useAws ? new CloudWatchLogsClient({ region }) : null;
let logStreamName = `instance-${Date.now()}`;
let streamInitialized = false;

async function ensureStreamExists() {
  if (!cwClient || streamInitialized) return;
  try {
    const describeCmd = new DescribeLogStreamsCommand({
      logGroupName: logGroup,
      logStreamNamePrefix: logStreamName
    });
    const result = await cwClient.send(describeCmd);
    if (!result.logStreams || result.logStreams.length === 0) {
      await cwClient.send(new CreateLogStreamCommand({
        logGroupName: logGroup,
        logStreamName: logStreamName
      }));
    }
    streamInitialized = true;
  } catch (err) {
    // If stream or group doesn't exist yet, warn gracefully
    // Console logging always continues
    streamInitialized = false;
  }
}

/**
 * Structured logger that writes to stdout and asynchronously buffers to CloudWatch Logs
 * Never logs sensitive data like passwords or JWT tokens!
 */
export function logEvent(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();

  // Strip sensitive fields if any exist
  const sanitizedMeta = { ...metadata };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'jwt', 'secret', 'authorization', 'cookie', 'apiKey', 'api_key'];
  for (const key of sensitiveKeys) {
    delete sanitizedMeta[key];
  }

  const logPayload = {
    timestamp,
    level,
    message,
    ...sanitizedMeta
  };

  const line = JSON.stringify(logPayload);
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }

  if (useAws && cwClient) {
    ensureStreamExists().then(() => {
      if (!streamInitialized) return;
      const cmd = new PutLogEventsCommand({
        logGroupName: logGroup,
        logStreamName: logStreamName,
        logEvents: [
          {
            timestamp: Date.now(),
            message: line
          }
        ]
      });
      return cwClient.send(cmd);
    }).catch(err => {
      // Non-blocking log failure
    });
  }
}
