import { test, describe } from 'node:test';
import assert from 'node:assert';
import { recommendPriority } from '../src/services/priorityRules.js';
import { confirmUpload } from '../src/controllers/uploadController.js';

describe('Role-Based Access Control & Tenant Isolation', () => {
  test('Rule-based priority engine enforces deterministic priority regardless of client wishes', () => {
    // When a student describes a loose chair or cosmetic flaw, rule engine returns 'low'
    const lowReport = recommendPriority({
      category: 'Furniture damage',
      title: 'Slightly loose screw on classroom chair',
      description: 'The chair wobbles slightly when sitting.'
    });
    assert.strictEqual(lowReport.recommendedPriority, 'low');

    // When an electrical hazard occurs, rule engine returns 'urgent'
    const urgentReport = recommendPriority({
      category: 'Electrical problems',
      title: 'Sparking exposed live wires in library corridor',
      description: 'Wires are sparking with smoke and burning plastic odor.'
    });
    assert.strictEqual(urgentReport.recommendedPriority, 'urgent');
  });

  test('confirmUpload rejects student attempt to attach evidence outside student namespace', async () => {
    const studentReq = {
      user: { id: 10, role: 'student', name: 'Student 10' },
      body: {
        complaintId: 1,
        // Attempting to attach another student's key (student-99)
        s3Key: 'evidence/student-99/1700000000000-abcd.jpg'
      }
    };

    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; }
        };
      }
    };

    let nextCalled = false;
    await confirmUpload(studentReq, res, (err) => { nextCalled = true; });

    assert.strictEqual(statusSent, 403);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonSent.error, /outside your student upload namespace/i);
  });

  test('confirmUpload rejects student attempt with path traversal in S3 key', async () => {
    const studentReq = {
      user: { id: 10, role: 'student', name: 'Student 10' },
      body: {
        complaintId: 1,
        s3Key: '../../etc/passwd'
      }
    };

    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (data) => { jsonSent = data; }
        };
      }
    };

    let nextCalled = false;
    await confirmUpload(studentReq, res, (err) => { nextCalled = true; });

    assert.strictEqual(statusSent, 403);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonSent.error, /outside your student upload namespace/i);
  });
});
