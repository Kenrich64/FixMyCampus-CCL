import { test, describe } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, getJwtSecret } from '../src/middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_jwt_key_replace_in_production_32_chars';

describe('Security & Authentication Suite', () => {
  test('hashes passwords using bcrypt with salt rounds >= 10', async () => {
    const plain = 'StudentPassSecure2026!';
    const hash = await bcrypt.hash(plain, 10);

    assert.notStrictEqual(plain, hash);
    assert.ok(hash.startsWith('$2')); // bcrypt format prefix

    const isValid = await bcrypt.compare(plain, hash);
    assert.strictEqual(isValid, true);

    const isInvalid = await bcrypt.compare('WrongPassword!', hash);
    assert.strictEqual(isInvalid, false);
  });

  test('authenticateToken middleware rejects requests without token with 401', () => {
    const req = { headers: {} };
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
    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 401);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonSent.error, /Missing access token/i);
  });

  test('authenticateToken middleware rejects invalid or tampered JWT with 401', () => {
    const req = { headers: { authorization: 'Bearer invalid.tampered.token' } };
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
    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 401);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonSent.error, /Invalid or expired/i);
  });

  test('authenticateToken attaches verified identity for valid tokens', () => {
    const payload = { id: 42, email: 'student@fixmycampus.edu', role: 'student', name: 'Test Student' };
    const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.id, 42);
    assert.strictEqual(req.user.email, 'student@fixmycampus.edu');
    assert.strictEqual(req.user.role, 'student');
  });

  test('requireRole middleware blocks student from accessing administrator routes with 403', () => {
    const studentReq = { user: { id: 10, role: 'student', name: 'Student User' } };
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

    const adminOnly = requireRole(['admin']);
    let nextCalled = false;

    adminOnly(studentReq, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 403);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonSent.error, /Access denied/i);
  });

  test('requireRole middleware permits administrator to proceed', () => {
    const adminReq = { user: { id: 1, role: 'admin', name: 'Campus Admin' } };
    const res = {};
    const adminOnly = requireRole(['admin']);
    let nextCalled = false;

    adminOnly(adminReq, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  test('getJwtSecret refuses hardcoded fallback in production mode when JWT_SECRET is missing', () => {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      assert.throws(
        () => {
          getJwtSecret();
        },
        /FATAL SECURITY CONFIGURATION: JWT_SECRET environment variable is missing in production mode/
      );
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevSecret) process.env.JWT_SECRET = prevSecret;
    }
  });
});
