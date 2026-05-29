import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import userController from '../controllers/userController.js';

const router = express.Router();

// ─── GET /api/users/profile ───────────────────────────────────────────────
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name avatar role email bio studentProfile mentorProfile createdAt')
      .lean();

    if (!user) return next(apiError('User not found', 404));

    const { followeeCount, followerCount, postCount } = await Promise.all([
      Follow.countDocuments({ following: req.user.id }),
      Follow.countDocuments({ follower: req.user.id }),
      Post.countDocuments({ author: req.user.id, isDeleted: false }),
    ]);

    return res.json(apiSuccess({
      user,
      stats: { followeeCount, followerCount, postCount },
      isFollowing: false,
    }));
  } catch (error) {
    next(error);
  }
});

router.put('/profile', protect, userController.updateProfile.bind(userController));
router.put('/change-password', protect, userController.changePassword.bind(userController));
router.get('/settings', protect, userController.getSettings.bind(userController));
router.put('/settings', protect, userController.updateSettings.bind(userController));

// ─── GET /api/users/:id ─────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar role email bio studentProfile mentorProfile createdAt')
      .lean();

    if (!user) return next(apiError('User not found', 404));

    const { followeeCount, followerCount, postCount } = await Promise.all([
      Follow.countDocuments({ following: req.params.id }),
      Follow.countDocuments({ follower: req.params.id }),
      Post.countDocuments({ author: req.params.id, isDeleted: false }),
    ]);

    let isFollowing = false;
    if (req.user?.id) {
      const follow = await Follow.findOne({ follower: req.user.id, following: req.params.id });
      isFollowing = !!follow;
    }

    return res.json(apiSuccess({
      user,
      stats: { followeeCount, followerCount, postCount },
      isFollowing,
    }));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/users/:id/follow ────────────────────────────────────────
router.post('/:id/follow', protect, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(apiError('Cannot follow yourself', 400));
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return next(apiError('User not found', 404));

    const existing = await Follow.findOne({ follower: req.user.id, following: req.params.id });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      return res.json(apiSuccess({ following: false }));
    }

    await Follow.create({ follower: req.user.id, following: req.params.id });
    return res.json(apiSuccess({ following: true }));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/users/:id/followers ──────────────────────────────────────
router.get('/:id/followers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [followers, total] = await Promise.all([
      Follow.find({ following: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('follower', 'name avatar role')
        .lean(),
      Follow.countDocuments({ following: req.params.id }),
    ]);

    return res.json(apiSuccess({
      users: followers.map(f => f.follower),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/users/:id/following ──────────────────────────────────────
router.get('/:id/following', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [following, total] = await Promise.all([
      Follow.find({ follower: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('following', 'name avatar role')
        .lean(),
      Follow.countDocuments({ follower: req.params.id }),
    ]);

    return res.json(apiSuccess({
      users: following.map(f => f.following),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
