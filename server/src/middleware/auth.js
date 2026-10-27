import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Retrieve active JWT secret with strict production guard.
 * Prevents hardcoded development credentials from being used in production paths.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY CONFIGURATION: JWT_SECRET environment variable is missing in production mode. Set /fixmycampus/jwt-secret in Parameter Store or configure JWT_SECRET.');
    }
    return 'dev_super_secret_jwt_key_replace_in_production_32_chars';
  }
  return secret;
}

/**
 * Authentication Middleware
 * Validates JWT token from the Authorization header and attaches the verified user payload.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing access token.'
    });
  }

  let secret;
  try {
    secret = getJwtSecret();
  } catch (err) {
    return next(err);
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session. Please log in again.'
      });
    }

    // Attach validated identity to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };

    next();
  });
}

/**
 * Role-Based Access Control Middleware
 * Enforces server-side authorization check. Browser-supplied roles are strictly ignored.
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to perform this action.'
      });
    }

    next();
  };
}
