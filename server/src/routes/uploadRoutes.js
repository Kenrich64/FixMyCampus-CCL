import express from 'express';
import {
  createUploadPresignedUrl,
  confirmUpload,
  handleLocalMockUpload,
  handleLocalMockView
} from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Authenticated upload endpoints
router.post('/presigned-url', authenticateToken, createUploadPresignedUrl);
router.post('/confirm', authenticateToken, confirmUpload);

// Local development simulation endpoints
router.put('/local-mock-upload', handleLocalMockUpload);
router.get('/local-mock-view', handleLocalMockView);

export default router;
