import { Router } from 'express';
import { body, query } from 'express-validator';
import { transactionController } from '../controllers/index.js';
import { protect, validate } from '../middleware/index.js';
import { adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// ── Admin routes ─────────────────────────────────────────────────────────────

// Admin: view ALL transactions with user info
router.get(
  '/admin/all',
  adminOnly,
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category')
      .optional()
      .custom((v) => v === '' || [
        'document_purchase', 'top_suggestion', 'donate',
        // Các category khác trong hệ thống vẫn có thể có trong DB (dữ liệu cũ)
        'mentor_session', 'subscription', 'refund', 'other',
      ].includes(v))
      .withMessage('Loại giao dịch không hợp lệ'),
    query('status')
      .optional()
      .custom((v) => v === '' || ['pending', 'completed', 'failed', 'cancelled'].includes(v))
      .withMessage('Trạng thái không hợp lệ'),
  ]),
  transactionController.getAllAdmin
);

// Admin: bulk delete transactions by IDs
router.delete('/admin/bulk', adminOnly, transactionController.bulkDelete);

// ── User / Mentor routes ──────────────────────────────────────────────────────

// User/Mentor: view own payment history (chỉ 3 loại: mua tài liệu, đề xuất top, donate)
router.get(
  '/my-payments',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category')
      .optional()
      .custom((v) => v === '' || ['document_purchase', 'top_suggestion', 'donate'].includes(v))
      .withMessage('Loại giao dịch không hợp lệ. Chỉ hỗ trợ: document_purchase, top_suggestion, donate'),
    query('status')
      .optional()
      .custom((v) => v === '' || ['pending', 'completed', 'failed', 'cancelled'].includes(v))
      .withMessage('Trạng thái không hợp lệ'),
  ]),
  transactionController.getMyPayments
);

// ── General routes ────────────────────────────────────────────────────────────

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type')
      .optional()
      .custom((v) => v === '' || ['income', 'expense', 'transfer'].includes(v))
      .withMessage('Loại giao dịch không hợp lệ'),
    query('category').optional(),
    query('status')
      .optional()
      .custom((v) => v === '' || ['pending', 'completed', 'failed', 'cancelled'].includes(v))
      .withMessage('Trạng thái không hợp lệ'),
  ]),
  transactionController.getAll
);

router.get('/stats', transactionController.getStats);

router.get('/:id', transactionController.getById);

// Tạo giao dịch thủ công (chỉ dùng nội bộ / test)
router.post(
  '/',
  validate([
    body('amount')
      .notEmpty().withMessage('Số tiền không được để trống')
      .isNumeric().withMessage('Số tiền phải là số')
      .custom((v) => v > 0).withMessage('Số tiền phải lớn hơn 0'),
    body('type')
      .notEmpty().withMessage('Loại giao dịch không được để trống')
      .isIn(['income', 'expense', 'transfer']).withMessage('Loại giao dịch không hợp lệ'),
    body('category')
      .notEmpty().withMessage('Danh mục không được để trống')
      .isIn([
        // Chỉ 3 loại thanh toán hợp lệ trên giao diện
        'document_purchase', 'top_suggestion', 'donate',
        // Các loại legacy / nội bộ vẫn giữ trong enum để tương thích DB cũ
        'salary', 'investment', 'food', 'transport', 'shopping',
        'bills', 'entertainment', 'health', 'education',
        'mentor_session', 'subscription', 'refund', 'other',
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
      .custom((v) => v > 0).withMessage('Số tiền phải lớn hơn 0'),
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
