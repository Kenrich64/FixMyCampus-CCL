import express from 'express';
import { getStudentDashboard, getAdminDashboard } from '../controllers/dashboardController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Student Dashboard metrics
router.get('/student', authenticateToken, requireRole(['student']), getStudentDashboard);

// Administrator Dashboard metrics & analytics
router.get('/admin', authenticateToken, requireRole(['admin']), getAdminDashboard);

export default router;
