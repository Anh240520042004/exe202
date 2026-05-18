import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/index.js';
import { protect, validate } from '../middleware/index.js';

const router = Router();

router.use(protect);

router.get('/profile', userController.getProfile);

router.put(
  '/profile',
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Tên phải từ 1-100 ký tự'),
    body('avatar')
      .optional()
      .isURL().withMessage('Avatar phải là URL hợp lệ'),
  ]),
  userController.updateProfile
);

router.put(
  '/change-password',
  validate([
    body('currentPassword')
      .notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
    body('newPassword')
      .notEmpty().withMessage('Mật khẩu mới không được để trống')
      .isLength({ min: 6 }).withMessage('Mật khẩu mới ít nhất 6 ký tự'),
  ]),
  userController.changePassword
);

router.get('/settings', userController.getSettings);

router.put('/settings', userController.updateSettings);

router.get('/orders', userController.getPurchaseHistory);

router.get('/payments', userController.getPaymentHistory);

export default router;
