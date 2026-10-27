import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { getJwtSecret } from '../middleware/auth.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new Student
 * Security: Public registration ONLY allows role='student'. Role cannot be elevated here.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Hardcoded role: 'student' (Prevent role manipulation)
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [cleanName, cleanEmail, passwordHash, 'student']
    );

    const newUser = result.rows[0];

    // Issue JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login User (Student or Administrator)
 * Security: Uses generic error message to prevent account enumeration.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Fetch user by email
    const result = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      // Generic error message to prevent user enumeration
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}
