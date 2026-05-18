import express from 'express';
import { protect } from '../middleware/auth.js';
import { getStudentDashboard, getAdminDashboard } from '../controllers/index.js';

const router = express.Router();

router.get('/student', protect, getStudentDashboard);
router.get('/admin', protect, getAdminDashboard);

export default router;
