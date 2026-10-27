import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with brute-force rate limiting
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Authenticated route
router.get('/me', authenticateToken, getMe);

export default router;
