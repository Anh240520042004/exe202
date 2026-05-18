import express from 'express';
import { protect } from '../middleware/auth.js';
import * as gamificationController from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/stats', protect, gamificationController.getUserStats);
router.get('/leaderboard', protect, gamificationController.getLeaderboard);
router.get('/badges', protect, gamificationController.getAllBadges);
router.get('/badges/:code', protect, gamificationController.getBadgeDetails);

export default router;
