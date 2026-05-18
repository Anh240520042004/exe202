import { Router } from 'express';
import { body, query } from 'express-validator';
import { transactionController } from '../controllers/index.js';
import { protect, validate } from '../middleware/index.js';

const router = Router();

router.use(protect);

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type')
      .optional()
      .custom((value) => value === '' || ['income', 'expense', 'transfer'].includes(value))
      .withMessage('Loại giao dịch không hợp lệ'),
    query('category').optional(),
    query('status')
      .optional()
      .custom((value) => value === '' || ['pending', 'completed', 'failed', 'cancelled'].includes(value))
      .withMessage('Trạng thái không hợp lệ'),
  ]),
  transactionController.getAll
);

router.get('/stats', transactionController.getStats);

router.get('/:id', transactionController.getById);

router.post(
  '/',
  validate([
    body('amount')
      .notEmpty().withMessage('Số tiền không được để trống')
      .isNumeric().withMessage('Số tiền phải là số')
      .custom((value) => value > 0).withMessage('Số tiền phải lớn hơn 0'),
    body('type')
      .notEmpty().withMessage('Loại giao dịch không được để trống')
      .isIn(['income', 'expense', 'transfer']).withMessage('Loại giao dịch không hợp lệ'),
    body('category')
      .notEmpty().withMessage('Danh mục không được để trống')
      .isIn([
        'salary', 'investment', 'food', 'transport', 'shopping',
        'bills', 'entertainment', 'health', 'education',
        'document_purchase', 'mentor_session', 'subscription', 'refund', 'other'
      ]).withMessage('Danh mục không hợp lệ'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
  ]),
  transactionController.create
);

router.put(
  '/:id',
  validate([
    body('amount')
      .optional()
      .isNumeric().withMessage('Số tiền phải là số')
      .custom((value) => value > 0).withMessage('Số tiền phải lớn hơn 0'),
    body('type')
      .optional()
      .isIn(['income', 'expense', 'transfer']).withMessage('Loại giao dịch không hợp lệ'),
    body('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Trạng thái không hợp lệ'),
  ]),
  transactionController.update
);

router.delete('/:id', transactionController.delete);

export default router;
