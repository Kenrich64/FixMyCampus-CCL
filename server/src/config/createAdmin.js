import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, query, initDbPool } from './db.js';
import { loadParameterStoreConfig } from '../services/ssmService.js';

dotenv.config();

async function createAdmin() {
  if (process.env.USE_AWS_SERVICES === 'true') {
    await loadParameterStoreConfig();
    initDbPool();
  }

  console.log('----------------------------------------------------');
  console.log('🛡️ FixMyCampus Development Administrator Creation');
  console.log('----------------------------------------------------');

  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_ADMIN_SEED) {
    console.error('⛔ REFUSED: Administrator seeding script cannot be run in production without explicit confirmation flag (ALLOW_PROD_ADMIN_SEED).');
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || 'Campus Facility Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@fixmycampus.edu').toLowerCase().trim();
  let password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Security Error: In production, ADMIN_PASSWORD must be explicitly provided.');
      process.exit(1);
    }
    password = 'AdminSecureCampus2026!';
  }

  if (!email || password.length < 8) {
    console.error('❌ Validation Error: ADMIN_EMAIL and strong ADMIN_PASSWORD (min 8 chars) required.');
    process.exit(1);
  }

  try {
    const existing = await query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (existing.rows.length > 0) {
      console.log(`ℹ️ User ${email} already exists (Role: ${existing.rows[0].role}). Updating to admin and resetting password...`);
      await query(
        'UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE email = $4',
        [name, passwordHash, 'admin', email]
      );
      console.log(`✅ Administrator account updated successfully!`);
    } else {
      await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [name, email, passwordHash, 'admin']
      );
      console.log(`✅ Administrator account created successfully!`);
    }

    console.log(`Email:    ${email}`);
    console.log(`Role:     admin`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Failed to create administrator:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
