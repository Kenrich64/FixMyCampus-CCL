import { test, describe } from 'node:test';
import assert from 'node:assert';
import http from 'http';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/index.js');

describe('Application Health Endpoint Resilience', () => {
  test('Health check accurately probes database and does not expose sensitive error strings', async () => {
    // When DB is offline, /api/health returns 503 with sanitized status
    const req = {};
    let statusSent = null;
    let jsonSent = null;

    // Use app directly or invoke endpoint handler
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      const body = await res.json();

      // Database is offline locally, so status should be 503 degraded
      assert.strictEqual(res.status, 503);
      assert.strictEqual(body.status, 'degraded');
      assert.strictEqual(body.database, 'disconnected');

      // Crucial: Sensitive stack traces and ECONNREFUSED error strings must not be in payload
      assert.strictEqual(body.error, undefined);
      assert.strictEqual(typeof body.database, 'string');
      assert.ok(!JSON.stringify(body).includes('ECONNREFUSED'));
      assert.ok(!JSON.stringify(body).includes('password'));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
