import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query, initDbPool } from './db.js';
import { loadParameterStoreConfig } from '../services/ssmService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (process.env.USE_AWS_SERVICES === 'true') {
    await loadParameterStoreConfig();
    initDbPool();
  }

  console.log('----------------------------------------------------');
  console.log('🔄 Running FixMyCampus Database Migrations...');
  console.log(`Database Host: ${process.env.PGHOST || 'localhost'}`);
  console.log(`Database Name: ${process.env.PGDATABASE || 'fixmycampus'}`);
  console.log('----------------------------------------------------');

  const migrationFile = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  try {
    await query(sql);
    console.log('✅ Migration 001_initial_schema.sql executed successfully!');
    console.log('Tables verified: users, complaints, complaint_history, complaint_ref_seq.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
