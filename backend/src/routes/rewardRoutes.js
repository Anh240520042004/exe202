import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import * as rewardController from '../controllers/rewardController.js';

const router = express.Router();

router.get('/balance', protect, rewardController.getPointBalance);
router.get('/history', protect, rewardController.getPointHistory);
router.get('/leaderboard', protect, rewardController.getPointsLeaderboard);
router.get('/required', protect, rewardController.getPointsRequired);

router.post('/redeem', protect, rewardController.redeemPointsForDocument);

// Admin routes
router.post('/adjust', protect, adminOnly, rewardController.adjustPoints);

export default router;
