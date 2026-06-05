import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createVNPayUrl,
  verifyVNPayReturn,
  createSePayPayment,
} from '../services/paymentService.js';
import { VNPay, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import Order from '../models/Order.js';import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import { User, RewardPoint } from '../models/index.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import emailService from '../services/emailService.js';
import mongoose from 'mongoose';

const POINTS_PER_VND = 0.01;
const calculatePointsFromPurchase = (amountVnd) => Math.floor(amountVnd * POINTS_PER_VND);

const earnPoints = async (userId, amountVnd, orderId) => {
  const points = calculatePointsFromPurchase(amountVnd);
  if (points <= 0) return null;
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;
  const newBalance = (user.studentProfile?.rewardPoints || 0) + points;
  await User.findByIdAndUpdate(userId, { 'studentProfile.rewardPoints': newBalance });
  return RewardPoint.create({
    user: userId,
    type: 'earn',
    points,
    reason: 'purchase',
    description: `Nhận ${points} điểm khi mua tài liệu`,
    orderId,
    balanceAfter: newBalance
  });
};

const router = express.Router();

const createNotification = async (userId, title, message, type = 'info') => {
  await Notification.create({ user: userId, title, message, type });
};

const isConfiguredSePayApiKey = (apiKey) => Boolean(
  apiKey && apiKey !== 'your_sepay_api_key' && apiKey !== 'YOUR_SEPAY_API_KEY'
);

// ─── Create QR payment (VNPay direct) ─────────────────────────────────────────
router.post('/create-qr', protect, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return next(apiError('Order ID is required', 400));

    const order = await Order.findById(orderId);
    if (!order) return next(apiError('Order not found', 404));
    if (order.user.toString() !== req.user.id) return next(apiError('Not authorized', 403));
    if (order.paymentStatus === 'paid') return next(apiError('Order already paid', 400));

    const date = new Date();
    const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const transactionId = `FPTAIEZ${order._id?.toString().slice(-8).toUpperCase() || Date.now()}`;

    const vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE || 'OZE53AQG',
      secureSecret: process.env.VNPAY_HASH_SECRET || 'NXZM3DWFRILC4R5VBK850JZS1UE9KI6F',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      enableLog: false,
    });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(order.totalAmount),
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `S${transactionId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(date),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.json(apiSuccess({
      paymentUrl,
      transactionId,
      amount: order.totalAmount,
    }, 'VNPay QR payment URL created'));

  } catch (error) {
    next(error);
  }
});

// ─── Create payment ──────────────────────────────────────────────────────────
router.post('/create', protect, async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'vnpay' } = req.body;
    if (!orderId) return next(apiError('Order ID is required', 400));

    const order = await Order.findById(orderId);
    if (!order) return next(apiError('Order not found', 404));
    if (order.user.toString() !== req.user.id) return next(apiError('Not authorized', 403));
    if (order.paymentStatus === 'paid') return next(apiError('Order already paid', 400));

    const payment = await Payment.create({
      user: req.user.id,
      type: 'document',
      orderId: order._id,
      amount: order.totalAmount,
      method: paymentMethod,
      status: 'pending'
    });

    const transactionId = `FPTAIEZ${order._id?.toString().slice(-8).toUpperCase() || Date.now()}`;
    const orderInfo = `Thanh toan tai lieu FPTAIEZ - ${transactionId}`;

    if (paymentMethod === 'vnpay') {
      const paymentData = createVNPayUrl({ amount: order.totalAmount, orderId: order._id, orderInfo, transactionId });
      payment.vnpayData = paymentData;
      await payment.save();

      order.paymentId = payment._id;
      order.paymentMethod = 'vnpay';
      await order.save();

      const transaction = await Transaction.create({
        user: req.user.id,
        amount: order.totalAmount,
        type: 'expense',
        category: 'document_purchase',
        description: `Yeu cau thanh toan tai lieu - Ma don: ${order._id}`,
        status: 'pending',
        orderId: order._id,
        paymentId: payment._id,
        transactionCode: transactionId,
        paymentMethod: 'vnpay',
        items: order.documents.map(doc => ({
          itemId: doc.document?._id || doc.document,
          itemType: 'document',
          name: doc.document?.title || 'Tai lieu',
          price: doc.price
        }))
      });

      order.transactionId = transaction._id;
      await order.save();

      return res.json(apiSuccess({
        paymentId: payment._id,
        paymentUrl: paymentData.vnpUrl,
        transactionId,
        method: 'vnpay',
      }, 'VNPay payment URL created'));

    } else if (paymentMethod === 'sepay') {
      const paymentData = await createSePayPayment({ amount: order.totalAmount, orderId: order._id, orderInfo, transactionId });
      payment.sepayData = paymentData;
      await payment.save();

      order.paymentId = payment._id;
      order.paymentMethod = 'sepay';
      await order.save();

      const transaction = await Transaction.create({
        user: req.user.id,
        amount: order.totalAmount,
        type: 'expense',
        category: 'document_purchase',
        description: `Yeu cau thanh toan tai lieu - Ma don: ${order._id}`,
        status: 'pending',
        orderId: order._id,
        paymentId: payment._id,
        transactionCode: transactionId,
        paymentMethod: 'sepay',
        items: order.documents.map(doc => ({
          itemId: doc.document?._id || doc.document,
          itemType: 'document',
          name: doc.document?.title || 'Tai lieu',
          price: doc.price
        }))
      });

      order.transactionId = transaction._id;
      await order.save();

      return res.json(apiSuccess({
        paymentId: payment._id,
        ...paymentData,
        transactionId,
        method: 'sepay',
      }, 'SePay payment data created'));

    } else {
      return next(apiError('Unsupported payment method', 400));
    }
  } catch (error) {
    next(error);
  }
});

// ─── VNPay return URL ────────────────────────────────────────────────────────
router.get('/vnpay-return', async (req, res, next) => {
  try {
    const result = verifyVNPayReturn(req.query);

    if (result.isSuccess) {
      const payment = await Payment.findOne({
        'vnpayData.vnp_TxnRef': result.vnp_TxnRef
      }).populate('user').populate({
        path: 'orderId',
        populate: { path: 'documents.document', model: 'Document' }
      });

      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.paymentStatus = 'paid';
        payment.vnpayData.vnp_ResponseCode = result.vnp_ResponseCode;
        payment.vnpayData.vnp_TransactionStatus = result.vnp_TransactionStatus;
        await payment.save();

        const order = await Order.findById(payment.orderId);
        order.status = 'completed';
        order.paymentStatus = 'paid';
        await order.save();

        for (const item of order.documents) {
          if (!item.document) continue;
          await Document.findByIdAndUpdate(item.document._id || item.document, { $inc: { salesCount: 1 } });
          await User.findByIdAndUpdate(order.user, {
            $push: { 'studentProfile.downloadHistory': { document: item.document._id || item.document, downloadedAt: new Date() } }
          });
        }

        if (order.transactionId) {
          await Transaction.findByIdAndUpdate(order.transactionId, {
            status: 'completed',
            transactionCode: `VNPAY${result.vnp_TxnRef}`
          });
        }

        try {
          await emailService.sendPaymentConfirmation(payment.user, {
            orderId: order._id, amount: payment.amount, method: 'vnpay',
            documents: order.documents.map(doc => ({ title: doc.document?.title || 'Tai lieu' })),
            transactionCode: `VNPAY${result.vnp_TxnRef}`, paymentDate: new Date()
          });
        } catch (e) { console.error('Email error:', e); }

        await createNotification(order.user, 'Thanh toan thanh cong!', 'Don hang cua ban da duoc xac nhan.', 'success');

        try {
          const pts = await earnPoints(order.user.toString(), payment.amount, order._id);
          if (pts) await createNotification(order.user.toString(), 'Nhận điểm thưởng!', `Bạn đã nhận được ${pts.points} điểm thưởng!`, 'success');
        } catch (e) { console.error('Points error:', e); }
      }

      const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=success&method=vnpay&orderId=${payment?.orderId?._id || ''}&amount=${result.vnp_Amount}`;
      return res.redirect(frontendUrl);

    } else {
      const payment = await Payment.findOne({ 'vnpayData.vnp_TxnRef': result.vnp_TxnRef });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.status = 'failed';
          await order.save();
          await createNotification(order.user, 'Thanh toan that bai', `Ma loi: ${result.vnp_ResponseCode}`, 'error');
        }
      }
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=failed&method=vnpay&code=${result.vnp_ResponseCode}`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=error&method=vnpay`);
  }
});

// ─── VNPay IPN ───────────────────────────────────────────────────────────────
router.post('/vnpay-ipn', async (req, res) => {
  try {
    const result = verifyVNPayReturn(req.query);
    res.status(200).json(result.isSuccess ? { RspCode: '00', Message: 'Success' } : { RspCode: result.vnp_ResponseCode, Message: 'Error' });
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// ─── SePay webhook ───────────────────────────────────────────────────────────
// Docs: https://sepay.vn/lap-trinh-webhook.html
router.post('/sepay-webhook', async (req, res) => {
  console.log('\n========================================');
  console.log('[SePay] WEBHOOK RECEIVED!');
  console.log('[SePay] Body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n');

  try {
    const apiKey = process.env.SEPAY_API_KEY || '';
    if (!isConfiguredSePayApiKey(apiKey)) {
      console.warn('[SePay] SEPAY_API_KEY is not configured');
      return res.status(200).json({ success: false, message: 'SePay webhook is not configured' });
    }

    const authHeader = req.headers.authorization;
    if (authHeader !== `Apikey ${apiKey}`) {
      console.warn('[SePay] Unauthorized webhook request');
      return res.status(200).json({ success: false, message: 'Unauthorized' });
    }

    // FIX 2: Dùng đúng tên field theo SePay API docs
    const {
      id: sepayId,
      gateway,
      transactionDate,
      accountNumber,
      subAccount,
      code,         // mã nội dung rút gọn
      content,      // nội dung chuyển khoản đầy đủ
      transferType, // 'in' = tiền vào, 'out' = tiền ra
      description,
      amount,       // số tiền, đơn vị VNĐ
      accumulated,
      referenceCode,
    } = req.body;

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored outgoing transfer' });
    }

    // FIX 3: Tìm mã đơn hàng trong tất cả field có thể chứa nội dung
    const rawContent = content || code || description || '';
    const orderIdMatch = rawContent.match(/FPTAIEZ([a-zA-Z0-9]+)/i);
    if (!orderIdMatch) {
      console.warn('[SePay] No FPTAIEZ code found in:', rawContent);
      return res.status(200).json({ success: false, message: 'Order code not found in transfer content' });
    }

    const transactionCode = orderIdMatch[0].toUpperCase();

    console.log('[SePay] ========== WEBHOOK RECEIVED ==========');
    console.log('[SePay] Raw content:', rawContent);
    console.log('[SePay] Transaction code:', transactionCode);
    console.log('[SePay] Amount received:', amount);

    let transaction = await Transaction.findOne({
      transactionCode,
      status: 'pending',
      paymentMethod: 'sepay'
    }).populate('orderId');

    if (!transaction) {
      console.warn('[SePay] No pending transaction for code:', transactionCode);
      // Thử tìm với mã khác (không có prefix SEPAY_)
      const fallbackTx = await Transaction.findOne({
        transactionCode: { $regex: transactionCode, $options: 'i' },
        status: 'pending',
      }).populate('orderId');
      if (fallbackTx) {
        console.log('[SePay] Found via fallback search');
        transaction = fallbackTx;
      } else {
        return res.status(200).json({ success: false, message: 'Transaction not found' });
      }
    }

    const order = transaction.orderId;
    console.log('[SePay] Order found:', order?._id);
    console.log('[SePay] Order totalAmount:', order?.totalAmount);
    console.log('[SePay] Order paymentStatus:', order?.paymentStatus);

    if (!order || order.paymentStatus === 'paid') {
      console.log('[SePay] Order already processed or not found');
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    const receivedAmount = Number(amount);
    console.log('[SePay] Received amount:', receivedAmount, '| Order amount:', order.totalAmount);

    if (!Number.isFinite(receivedAmount) || Math.round(receivedAmount) !== Math.round(order.totalAmount)) {
      console.warn('[SePay] Amount mismatch:', receivedAmount, '| Expected:', order.totalAmount);
      return res.status(200).json({ success: false, message: 'Amount mismatch' });
    }

    const expectedAccountNumber = `${process.env.SEPAY_ACCOUNT_NUMBER || ''}`.trim();
    const actualAccountNumber = `${accountNumber || ''}`.trim();
    if (expectedAccountNumber && actualAccountNumber && actualAccountNumber !== expectedAccountNumber) {
      console.warn('[SePay] Account mismatch:', actualAccountNumber, '| Expected:', expectedAccountNumber);
      return res.status(200).json({ success: false, message: 'Account mismatch' });
    }

    // Cập nhật Payment
    const payment = await Payment.findById(transaction.paymentId);
    if (payment) {
      payment.status = 'completed';
      payment.paymentStatus = 'paid';
      payment.sepayData = {
        ...payment.sepayData,
        sepayId,
        gateway,
        transferType,
        transferAmount: receivedAmount,
        transferContent: rawContent,
        accountNumber,
        subAccount,
        referenceCode,
        transferredAt: transactionDate || new Date(),
      };
      await payment.save();
    }

    // Cập nhật Order
    order.status = 'completed';
    order.paymentStatus = 'paid';
    await order.save();
    console.log('[SePay] Order updated:', order._id, '| Status:', order.paymentStatus);

    // Cập nhật Transaction
    transaction.status = 'completed';
    // Lưu SePay transaction code riêng (không đổi transactionCode gốc để frontend polling tìm được)
    transaction.providerTransactionCode = `SEPAY_${transactionCode}`;
    await transaction.save();
    console.log('[SePay] Transaction updated:', transaction._id, '| Status:', transaction.status);

    // Tăng salesCount + download history
    console.log('[SePay] Processing', order.documents.length, 'documents');
    for (const item of order.documents) {
      console.log('[SePay] - Document:', item.document, '| Type:', typeof item.document);
      if (!item.document) continue;
      const docId = typeof item.document === 'object' ? item.document._id : item.document;
      await Document.findByIdAndUpdate(docId, { $inc: { salesCount: 1 } });
      await User.findByIdAndUpdate(order.user, {
        $push: { 'studentProfile.downloadHistory': { document: docId, downloadedAt: new Date() } }
      });
      console.log('[SePay] Added document to download history:', docId);
    }

    // Notify user
    await createNotification(order.user, 'Thanh toán thành công!', 'Đơn hàng đã được xác nhận. Bạn có thể tải tài liệu ngay.', 'success');

    // Notify admins
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      await Promise.all(admins.map(admin =>
        createNotification(
          admin._id,
          'Thanh toán SePay thành công!',
          `Nhận ${Number(receivedAmount).toLocaleString('vi-VN')} VNĐ. Nội dung: ${rawContent}. Tài liệu đã kích hoạt tự động.`,
          'payment'
        )
      ));
    } catch (e) { console.error('Admin notify error:', e); }

    // Send email
    try {
      const user = await User.findById(order.user);
      await emailService.sendPaymentConfirmation(user, {
        orderId: order._id, amount: receivedAmount, method: 'sepay',
        documents: order.documents.map(doc => ({ title: doc.document?.title || 'Tai lieu' })),
        transactionCode: `SEPAY_${transactionCode}`, paymentDate: new Date()
      });
    } catch (e) { console.error('Email error:', e); }

    // Award points
    try {
      const pts = await earnPoints(order.user.toString(), receivedAmount, order._id);
      if (pts) await createNotification(order.user.toString(), 'Nhận điểm thưởng!', `Bạn đã nhận được ${pts.points} điểm thưởng!`, 'success');
    } catch (e) { console.error('Points error:', e); }

    return res.status(200).json({ success: true, message: 'Payment confirmed' });

  } catch (error) {
    console.error('[SePay webhook] Unhandled error:', error);
    return res.status(200).json({ success: false, message: 'Internal error' });
  }
});

// ─── Get payment status ──────────────────────────────────────────────────────
router.get('/status/:paymentId', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('orderId');
    if (!payment) return next(apiError('Payment not found', 404));
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }
    res.json(apiSuccess({
      paymentId: payment._id,
      status: payment.status,
      paymentStatus: payment.paymentStatus,
      amount: payment.amount,
      method: payment.method,
      createdAt: payment.createdAt,
    }));
  } catch (error) {
    next(error);
  }
});

// ─── Check payment by transaction code (polling) ─────────────────────────────
router.get('/check/:transactionCode', protect, async (req, res, next) => {
  try {
    const { transactionCode } = req.params;
    console.log('[Check] Looking for transaction:', transactionCode, '| User:', req.user.id);

    const transaction = await Transaction.findOne({
      transactionCode,
      user: req.user.id
    }).populate({
      path: 'orderId',
      populate: { path: 'documents.document', model: 'Document' }
    });

    console.log('[Check] Transaction found:', transaction?._id, '| Status:', transaction?.status);

    if (!transaction) return next(apiError('Transaction not found', 404));

    const payment = await Payment.findById(transaction.paymentId);

    res.json(apiSuccess({
      status: transaction.status,
      paymentStatus: transaction.status === 'completed' ? 'paid' : 'pending',
      orderId: transaction.orderId?._id,
      amount: transaction.amount,
      method: transaction.paymentMethod,
      paymentData: payment?.sepayData || payment?.vnpayData,
    }));
  } catch (error) {
    next(error);
  }
});

// ─── Debug: Get all pending transactions ──────────────────────────────────────
router.get('/debug-transactions', protect, adminOnly, async (req, res) => {
  const transactions = await Transaction.find({
    user: req.user.id,
    paymentMethod: 'sepay'
  }).sort({ createdAt: -1 }).limit(10);

  res.json({
    success: true,
    data: transactions.map(t => ({
      _id: t._id,
      transactionCode: t.transactionCode,
      status: t.status,
      amount: t.amount,
      createdAt: t.createdAt
    }))
  });
});

export default router;