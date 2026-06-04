import { Router } from 'express';
import { body } from 'express-validator';
import { adminController } from '../controllers/index.js';
import { protect, admin, validate } from '../middleware/index.js';

const router = Router();

router.use(protect);
router.use(admin);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);

router.put(
  '/users/:id',
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Tên phải từ 1-100 ký tự'),
    body('email')
      .optional()
      .isEmail().withMessage('Email không hợp lệ')
      .normalizeEmail(),
    body('role')
      .optional()
      // [FIX] Added 'mentor' — previously missing, admin couldn't set user as mentor
      .isIn(['user', 'student', 'mentor', 'admin']).withMessage('Role không hợp lệ'),
  ]),
  adminController.updateUser
);

router.delete('/users/:id', adminController.deleteUser);
router.get('/transactions', adminController.getAllTransactions);

export default router;
