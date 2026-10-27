import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

import fs from 'fs';

// Determine connection settings
function buildPoolConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalDb = (process.env.PGHOST === 'localhost' || process.env.PGHOST === '127.0.0.1') || (!process.env.PGHOST && !process.env.DATABASE_URL);
  const useSsl = process.env.PGSSL === 'true' || (isProduction && !isLocalDb);

  let sslConfig = false;
  if (useSsl) {
    sslConfig = { rejectUnauthorized: false };
    if (process.env.PGSSLROOTCERT && fs.existsSync(process.env.PGSSLROOTCERT)) {
      try {
        sslConfig = {
          rejectUnauthorized: true,
          ca: fs.readFileSync(process.env.PGSSLROOTCERT).toString()
        };
      } catch (e) {
        console.warn('[DB TLS WARNING] Could not read PGSSLROOTCERT file:', e.message);
      }
    }
  }

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    };
  }

  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const database = process.env.PGDATABASE || 'fixmycampus';
  const user = process.env.PGUSER || 'postgres';
  let password = process.env.PGPASSWORD;

  if (!password) {
    if (isProduction) {
      throw new Error('FATAL SECURITY CONFIGURATION: PGPASSWORD environment variable is missing in production mode. Set /fixmycampus/db-password in Parameter Store or configure PGPASSWORD.');
    }
    password = 'postgres';
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

let activePool = null;

export function initDbPool() {
  if (activePool) {
    try {
      activePool.end();
    } catch (e) {
      // Ignore cleanup error
    }
  }
  activePool = new Pool(buildPoolConfig());
  activePool.on('error', (err) => {
    console.error('[PostgreSQL Pool Unexpected Error]:', err.message);
  });
  return activePool;
}

export function getPool() {
  if (!activePool) {
    activePool = initDbPool();
  }
  return activePool;
}

// Proxy object to maintain seamless backward compatibility with `import { pool } from './db.js'`
export const pool = new Proxy({}, {
  get(target, prop) {
    const p = getPool();
    const val = p[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

/**
 * Standard Query Execution Function with Parameterized Values
 * Prevents SQL Injection vulnerabilities.
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL Query] (${duration}ms):`, text, params);
    }
    return res;
  } catch (error) {
    console.error(`[SQL Error] in query: ${text}`, error.message);
    throw error;
  }
}

/**
 * Transaction Helper
 * Automatically manages BEGIN, COMMIT, and ROLLBACK
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default {
  pool,
  query,
  withTransaction
};
