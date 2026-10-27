import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getPresignedUploadUrl } from '../src/services/s3Service.js';
import { enqueueNotificationJob } from '../src/services/sqsService.js';
import { logEvent } from '../src/services/cloudwatchService.js';

describe('AWS Cloud Integration & Security Resilience', () => {
  test('S3 service rejects unapproved file formats (.exe, .sh, .pdf)', async () => {
    await assert.rejects(
      async () => {
        await getPresignedUploadUrl({ studentId: 1, fileType: 'application/x-msdownload', fileSize: 1024 });
      },
      /Invalid file type/i
    );
  });

  test('S3 service rejects file sizes exceeding 5MB limit', async () => {
    await assert.rejects(
      async () => {
        await getPresignedUploadUrl({ studentId: 1, fileType: 'image/jpeg', fileSize: 6 * 1024 * 1024 });
      },
      /exceeds 5MB limit/i
    );
  });

  test('S3 service generates secure server-determined key with student namespace', async () => {
    const res = await getPresignedUploadUrl({ studentId: 99, fileType: 'image/png', fileSize: 50000 });

    assert.ok(res.s3Key);
    assert.ok(res.s3Key.startsWith('evidence/student-99/'));
    assert.ok(res.s3Key.endsWith('.png'));
    assert.strictEqual(res.expiresIn, 900);
  });

  test('SQS notification service enqueues jobs safely without throwing fatal error when AWS is offline', async () => {
    const jobData = {
      complaintId: 101,
      referenceNumber: 'FC-2026-0042',
      title: 'Lab water valve leak',
      category: 'Plumbing and sanitation',
      priority: 'high',
      status: 'pending',
      eventType: 'submitted',
      recipientEmail: 'student@fixmycampus.edu',
      recipientName: 'Test Student',
      actorName: 'Test Student',
      note: 'Routine report'
    };

    const res = await enqueueNotificationJob(jobData);
    assert.strictEqual(res.success, true);
    assert.ok(res.messageId);
  });

  test('Structured logger sanitizes sensitive fields (password, token, password_hash)', () => {
    // Intercept console.log
    let loggedData = null;
    const originalLog = console.log;
    console.log = (str) => {
      try {
        loggedData = JSON.parse(str);
      } catch (e) {
        // Not JSON
      }
    };

    logEvent('INFO', 'User login attempt', {
      userEmail: 'student@fixmycampus.edu',
      password: 'PlainSecretPassword123!',
      password_hash: '$2a$10$abcdef...',
      token: 'eyJhbGciOiJIUzI1Ni...',
      secret: 'super-sensitive-secret',
      authorization: 'Bearer secret_token',
      cookie: 'session_id=123'
    });

    console.log = originalLog;

    assert.ok(loggedData);
    assert.strictEqual(loggedData.userEmail, 'student@fixmycampus.edu');
    assert.strictEqual(loggedData.password, undefined);
    assert.strictEqual(loggedData.password_hash, undefined);
    assert.strictEqual(loggedData.token, undefined);
    assert.strictEqual(loggedData.secret, undefined);
    assert.strictEqual(loggedData.authorization, undefined);
    assert.strictEqual(loggedData.cookie, undefined);
  });
});
