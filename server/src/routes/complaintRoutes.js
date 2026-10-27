import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  updatePriority,
  assignComplaint,
  addNote,
  getComplaintHistory,
  getPriorityRecommendation
} from '../controllers/complaintController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All complaint routes require valid JWT authentication
router.use(authenticateToken);

// Live rule-based priority recommendation preview
router.post('/recommend-priority', getPriorityRecommendation);

// Complaint submission and listing
router.post('/', createComplaint);
router.get('/', getComplaints);

// Detail and history
router.get('/:id', getComplaintById);
router.get('/:id/history', getComplaintHistory);

// Administrator-only management actions
router.patch('/:id/status', requireRole(['admin']), updateStatus);
router.patch('/:id/priority', requireRole(['admin']), updatePriority);
router.patch('/:id/assign', requireRole(['admin']), assignComplaint);
router.post('/:id/notes', requireRole(['admin']), addNote);

export default router;
