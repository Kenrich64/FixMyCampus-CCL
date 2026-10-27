import { SSMClient, GetParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const useAws = process.env.USE_AWS_SERVICES === 'true';

const ssmClient = useAws ? new SSMClient({ region }) : null;

// Mapping of Parameter Store paths to environment variables
const PARAM_TO_ENV_MAP = {
  '/fixmycampus/jwt-secret': 'JWT_SECRET',
  '/fixmycampus/db-password': 'PGPASSWORD',
  '/fixmycampus/db-host': 'PGHOST',
  '/fixmycampus/db-port': 'PGPORT',
  '/fixmycampus/db-name': 'PGDATABASE',
  '/fixmycampus/db-user': 'PGUSER',
  '/fixmycampus/s3-bucket': 'S3_BUCKET_NAME',
  '/fixmycampus/sqs-url': 'SQS_QUEUE_URL',
  '/fixmycampus/sns-arn': 'SNS_TOPIC_ARN',
  '/fixmycampus/client-origin': 'CLIENT_ORIGIN'
};

/**
 * Automatically fetch and load production parameters from SSM Parameter Store into process.env.
 * Never prints or logs the secret parameter values.
 */
export async function loadParameterStoreConfig() {
  if (!useAws || !ssmClient) {
    return { loaded: false, reason: 'AWS services not enabled (USE_AWS_SERVICES != true)' };
  }

  try {
    const command = new GetParametersByPathCommand({
      Path: '/fixmycampus',
      Recursive: true,
      WithDecryption: true
    });

    const response = await ssmClient.send(command);
    const params = response.Parameters || [];
    let loadedCount = 0;

    for (const param of params) {
      const targetEnv = PARAM_TO_ENV_MAP[param.Name];
      if (targetEnv && param.Value) {
        process.env[targetEnv] = param.Value;
        loadedCount++;
      }
    }

    console.log(`[AWS SSM] Successfully synchronized ${loadedCount} parameter(s) from Parameter Store hierarchy (/fixmycampus).`);
    return { loaded: true, count: loadedCount };
  } catch (error) {
    console.warn(`[AWS SSM WARNING] Could not retrieve parameters from Parameter Store: ${error.message}. Continuing with local environment variables.`);
    return { loaded: false, error: error.message };
  }
}

/**
 * Fetch a single secure parameter from AWS Systems Manager Parameter Store.
 * In production on EC2, this eliminates the need to store secrets in plaintext.
 * In local development, falls back to process.env.
 */
export async function getSecretParameter(parameterName, fallbackEnvVar) {
  if (!useAws || !ssmClient) {
    return process.env[fallbackEnvVar] || null;
  }

  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true
    });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || process.env[fallbackEnvVar];
  } catch (error) {
    console.warn(`[SSM WARNING] Could not fetch ${parameterName} from Parameter Store: ${error.message}. Falling back to env.`);
    return process.env[fallbackEnvVar];
  }
}

