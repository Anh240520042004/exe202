import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/index.js';
import { protect, authLimiter, validate } from '../middleware/index.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { generateAccessToken, generateRefreshToken } from '../services/jwtService.js';

const router = Router();

// ─── Google OAuth ───────────────────────────────────────────────────────────
router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return next(apiError('Google ID token required', 400));

    // Verify Google token
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) return next(apiError('Invalid Google token', 400));

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        avatar: payload.picture,
        password: null,
        isVerified: true,
        authProvider: 'google',
        googleId: payload.sub,
      });
    } else {
      if (payload.picture && user.avatar !== payload.picture) {
        user.avatar = payload.picture;
        await user.save();
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return res.json(apiSuccess({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      isNewUser,
    }, isNewUser ? 'Dang ky bang Google thanh cong' : 'Dang nhap bang Google thanh cong'));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/register',
  authLimiter,
  validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Tên không được để trống')
      .isLength({ max: 100 }).withMessage('Tên không quá 100 ký tự'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống')
      .isLength({ min: 6 }).withMessage('Mật khẩu ít nhất 6 ký tự'),
    body('role')
      .optional()
      .isIn(['student', 'mentor']).withMessage('Vai trò không hợp lệ'),
  ]),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống'),
  ]),
  authController.login
);

// DEV ONLY: Reset password by email (for development/testing)
router.post(
  '/dev-reset-password',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('newPassword').isLength({ min: 6 }),
  ]),
  async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.refreshToken = null;
      await user.save();
      
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.post('/logout', protect, authController.logout);

router.post(
  '/refresh',
  validate([
    body('refreshToken')
      .notEmpty().withMessage('Refresh token không được để trống'),
  ]),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  authLimiter,
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
  ]),
  authController.forgotPassword
);

router.post(
  '/verify-email',
  validate([
    body('code')
      .notEmpty().withMessage('Mã xác thực không được để trống')
      .isLength({ min: 6, max: 6 }).withMessage('Mã xác thực phải 6 số'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
  ]),
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  authLimiter,
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email không được để trống')
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
  ]),
  authController.resendVerification
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token không được để trống'),
    body('password')
      .notEmpty().withMessage('Mật khẩu không được để trống')
      .isLength({ min: 6 }).withMessage('Mật khẩu ít nhất 6 ký tự'),
  ]),
  authController.resetPassword
);

export default router;
