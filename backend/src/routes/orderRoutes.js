import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

router.get('/', protect, orderController.getOrders);
router.get('/my-documents', protect, orderController.getMyDocuments);
router.get('/:id', protect, orderController.getOrderById);
router.get('/:orderId/documents/:documentId/download', protect, orderController.downloadDocument);

router.post('/', protect, orderController.createOrder);
router.post('/:orderId/payment', protect, orderController.initiatePayment);
router.post('/:orderId/banking', protect, orderController.initiateBankingPayment);
router.post('/:orderId/confirm-payment', protect, orderController.confirmPayment);

// Admin routes for payment approval
router.get('/admin/pending-payments', protect, adminOnly, orderController.getPendingPayments);
router.post('/:orderId/approve', protect, adminOnly, orderController.approvePayment);
router.post('/:orderId/reject', protect, adminOnly, orderController.rejectPayment);

router.post('/vnpay/callback', orderController.handleVNPayCallback);

router.post('/confirm-payment', protect, orderController.confirmPayment);

export default router;
