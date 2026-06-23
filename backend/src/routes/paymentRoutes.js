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

const PROMOTION_PLANS = {
  '7_days': { id: '7_days', name: 'Uu tien 7 ngay', days: 7, amount: 19000, priorityScore: 100 },
  '30_days': { id: '30_days', name: 'Uu tien 30 ngay', days: 30, amount: 49000, priorityScore: 140 },
  yearly: { id: 'yearly', name: 'Uu tien 1 nam', days: 365, amount: 299000, priorityScore: 200 },
};

const activatePaidMentorPromotion = async ({ mentorId, plan }) => {
  const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
  if (!mentor) return null;

  const now = new Date();
  const currentPaidUntil = mentor.mentorProfile?.promotion?.paidUntil
    ? new Date(mentor.mentorProfile.promotion.paidUntil)
    : null;
  const paidUntil = currentPaidUntil && currentPaidUntil > now ? currentPaidUntil : now;
  paidUntil.setDate(paidUntil.getDate() + plan.days);

  mentor.set({
    'mentorProfile.promotion.isPromoted': true,
    'mentorProfile.promotion.priorityScore': plan.priorityScore,
    'mentorProfile.promotion.paidUntil': paidUntil,
    'mentorProfile.promotion.campaignName': plan.name,
  });
  await mentor.save();

  return mentor;
};

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
    description: `Nháº­n ${points} Ä‘iá»ƒm khi mua tÃ i liá»‡u`,
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

const getSePayWebhookKey = (req) => {
  const queryKey = req.query.apikey || req.query['api-key'];
  if (queryKey) return String(queryKey).trim();

  const authorization = `${req.headers.authorization || ''}`.trim();
  const apiKeyHeader = `${req.headers['x-api-key'] || req.headers.apikey || req.headers['api-key'] || ''}`.trim();

  if (apiKeyHeader) return apiKeyHeader;
  if (!authorization) return '';

  const match = authorization.match(/^(apikey|api-key|bearer)\s+(.+)$/i);
  return (match?.[2] || authorization).trim();
};

const parseVndAmount = (value) => {
  if (value === undefined || value === null || value === '') return NaN;
  return Number(String(value).replace(/[^\d.-]/g, ''));
};

// â”€â”€â”€ Create QR payment (VNPay direct) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Create payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/create', protect, async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'sepay' } = req.body;
    if (!orderId) return next(apiError('Order ID is required', 400));
    if (paymentMethod !== 'sepay') return next(apiError('Only SePay payments are supported', 400));

    const order = await Order.findById(orderId);
    if (!order) return next(apiError('Order not found', 404));
    if (order.user.toString() !== req.user.id) return next(apiError('Not authorized', 403));
    if (order.paymentStatus === 'paid') return next(apiError('Order already paid', 400));

    const existingPendingPayment = await Payment.findOne({
      orderId: order._id,
      method: paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    }).sort({ createdAt: -1 });

    if (paymentMethod === 'sepay' && existingPendingPayment?.sepayData?.transactionId) {
      const existingTransaction = await Transaction.findOne({
        orderId: order._id,
        paymentId: existingPendingPayment._id,
        paymentMethod: 'sepay',
        status: 'pending'
      }).sort({ createdAt: -1 });

      order.paymentId = existingPendingPayment._id;
      if (existingTransaction) {
        order.transactionId = existingTransaction._id;
      }
      order.paymentMethod = 'sepay';
      await order.save();

      return res.json(apiSuccess({
        paymentId: existingPendingPayment._id,
        ...existingPendingPayment.sepayData,
        transactionId: existingPendingPayment.sepayData.transactionId,
        method: 'sepay',
      }, 'Existing SePay payment data returned'));
    }

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

router.post('/mentor-promotion/create', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return next(apiError('Only mentors can promote their profile', 403));
    }

    const { planId } = req.body;
    const plan = PROMOTION_PLANS[planId];
    if (!plan) return next(apiError('Invalid promotion plan', 400));

    const mentor = await User.findOne({ _id: req.user.id, role: 'mentor' });
    if (!mentor) return next(apiError('Mentor not found', 404));

    const existingPendingPayment = await Payment.findOne({
      user: req.user.id,
      type: 'mentor',
      method: 'sepay',
      status: 'pending',
      paymentStatus: 'pending',
      'mentorPromotion.planId': plan.id,
    }).sort({ createdAt: -1 });

    if (existingPendingPayment?.sepayData?.transactionId) {
      return res.json(apiSuccess({
        paymentId: existingPendingPayment._id,
        plan,
        ...existingPendingPayment.sepayData,
        transactionId: existingPendingPayment.sepayData.transactionId,
        method: 'sepay',
      }, 'Existing mentor promotion payment data returned'));
    }

    const payment = await Payment.create({
      user: req.user.id,
      type: 'mentor',
      orderId: req.user.id,
      amount: plan.amount,
      method: 'sepay',
      status: 'pending',
      paymentStatus: 'pending',
      mentorPromotion: {
        mentorId: req.user.id,
        planId: plan.id,
        planName: plan.name,
        days: plan.days,
        priorityScore: plan.priorityScore,
        campaignName: plan.name,
      },
    });

    const transactionId = `FPTBOOST${payment._id.toString().slice(-8).toUpperCase()}`;
    const orderInfo = `${plan.name} FPTAIEZ - ${transactionId}`;
    const paymentData = await createSePayPayment({
      amount: plan.amount,
      orderId: payment._id,
      orderInfo,
      transactionId,
    });

    payment.sepayData = paymentData;
    payment.transactionId = transactionId;
    await payment.save();

    await Transaction.create({
      user: req.user.id,
      amount: plan.amount,
      type: 'expense',
      category: 'top_suggestion',
      description: `Thanh toan goi de xuat mentor - ${plan.name}`,
      status: 'pending',
      paymentId: payment._id,
      transactionCode: transactionId,
      paymentMethod: 'sepay',
      items: [{
        itemId: req.user.id,
        itemType: 'mentor',
        name: plan.name,
        price: plan.amount,
      }],
    });

    return res.json(apiSuccess({
      paymentId: payment._id,
      plan,
      ...paymentData,
      transactionId,
      method: 'sepay',
    }, 'Mentor promotion SePay payment data created'));
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ VNPay return URL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          if (pts) await createNotification(order.user.toString(), 'Nháº­n Ä‘iá»ƒm thÆ°á»Ÿng!', `Báº¡n Ä‘Ã£ nháº­n Ä‘Æ°á»£c ${pts.points} Ä‘iá»ƒm thÆ°á»Ÿng!`, 'success');
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

// â”€â”€â”€ VNPay IPN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/vnpay-ipn', async (req, res) => {
  try {
    const result = verifyVNPayReturn(req.query);
    res.status(200).json(result.isSuccess ? { RspCode: '00', Message: 'Success' } : { RspCode: result.vnp_ResponseCode, Message: 'Error' });
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// â”€â”€â”€ SePay webhook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    const receivedApiKey = getSePayWebhookKey(req);
    if (receivedApiKey !== apiKey) {
      console.warn('[SePay] Unauthorized webhook request. Auth header present:', Boolean(req.headers.authorization), '| x-api-key present:', Boolean(req.headers['x-api-key']));
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // FIX 2: DÃ¹ng Ä‘Ãºng tÃªn field theo SePay API docs
    const {
      id: sepayId,
      gateway,
      transactionDate,
      accountNumber,
      subAccount,
      code,         // mÃ£ ná»™i dung rÃºt gá»n
      content,      // ná»™i dung chuyá»ƒn khoáº£n Ä‘áº§y Ä‘á»§
      transferType, // 'in' = tiá»n vÃ o, 'out' = tiá»n ra
      description,
      transferContent,
      transferAmount,
      amount,       // sá»‘ tiá»n, Ä‘Æ¡n vá»‹ VNÄ
      accumulated,
      referenceCode,
    } = req.body;

    // Chá»‰ xá»­ lÃ½ giao dá»‹ch tiá»n vÃ o
    if (transferType && String(transferType).toLowerCase() !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored outgoing transfer' });
    }

    // FIX 3: TÃ¬m mÃ£ Ä‘Æ¡n hÃ ng trong táº¥t cáº£ field cÃ³ thá»ƒ chá»©a ná»™i dung
    const rawContent = content || transferContent || code || description || '';
    const orderIdMatch = rawContent.match(/FPT(?:AIEZ|BOOST)([a-zA-Z0-9]+)/i);
    if (!orderIdMatch) {
      console.warn('[SePay] No FPTAIEZ code found in:', rawContent);
      return res.status(200).json({ success: false, message: 'Order code not found in transfer content' });
    }

    const transactionCode = orderIdMatch[0].toUpperCase();

    console.log('[SePay] ========== WEBHOOK RECEIVED ==========');
    console.log('[SePay] Raw content:', rawContent);
    console.log('[SePay] Transaction code:', transactionCode);
    console.log('[SePay] Amount received:', amount ?? transferAmount);

    let transaction = await Transaction.findOne({
      transactionCode,
      status: 'pending',
      paymentMethod: 'sepay'
    }).sort({ createdAt: -1 }).populate('orderId');

    if (!transaction) {
      const completedTransaction = await Transaction.findOne({
        transactionCode,
        status: 'completed',
        paymentMethod: 'sepay'
      }).sort({ createdAt: -1 });

      if (completedTransaction) {
        console.log('[SePay] Transaction already completed for code:', transactionCode);
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      console.warn('[SePay] No pending transaction for code:', transactionCode);
      // Thử tìm với mã khác (không có prefix SEPAY_)
      const fallbackTx = await Transaction.findOne({
        transactionCode: { $regex: transactionCode, $options: 'i' },
        status: 'pending',
        paymentMethod: 'sepay'
      }).sort({ createdAt: -1 }).populate('orderId');
      if (fallbackTx) {
        console.log('[SePay] Found via fallback search');
        transaction = fallbackTx;
      } else {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
    }

    const receivedAmount = parseVndAmount(amount ?? transferAmount);
    const payment = await Payment.findById(transaction.paymentId);

    if (payment?.type === 'mentor' && payment.mentorPromotion?.mentorId) {
      if (!Number.isFinite(receivedAmount) || Math.round(receivedAmount) !== Math.round(payment.amount)) {
        console.warn('[SePay] Mentor promotion amount mismatch:', receivedAmount, '| Expected:', payment.amount);
        return res.status(400).json({ success: false, message: 'Amount mismatch' });
      }

      const expectedAccountNumber = `${process.env.SEPAY_ACCOUNT_NUMBER || ''}`.trim();
      const actualAccountNumber = `${accountNumber || ''}`.trim();
      const actualSubAccount = `${subAccount || ''}`.trim();

      if (expectedAccountNumber) {
        if (actualAccountNumber !== expectedAccountNumber && actualSubAccount !== expectedAccountNumber) {
          console.warn('[SePay] Account mismatch (Mentor):', actualAccountNumber, '| SubAccount:', actualSubAccount, '| Expected:', expectedAccountNumber);
          return res.status(400).json({ success: false, message: 'Account mismatch' });
        }
      }

      const plan = {
        id: payment.mentorPromotion.planId,
        name: payment.mentorPromotion.planName,
        days: payment.mentorPromotion.days,
        amount: payment.amount,
        priorityScore: payment.mentorPromotion.priorityScore,
      };
      const mentor = await activatePaidMentorPromotion({
        mentorId: payment.mentorPromotion.mentorId,
        plan,
      });

      if (!mentor) {
        return res.status(404).json({ success: false, message: 'Mentor not found' });
      }

      payment.status = 'completed';
      payment.paymentStatus = 'paid';
      const currentSepayData = payment.sepayData && typeof payment.sepayData.toObject === 'function' ? payment.sepayData.toObject() : (payment.sepayData || {});
      payment.sepayData = {
        ...currentSepayData,
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

      transaction.status = 'completed';
      transaction.providerTransactionCode = `SEPAY_${transactionCode}`;
      await transaction.save();

      // Tính số tháng/ngày từ plan
      let durationDisplay = '7 ngày';
      if (plan.id === '30_days') durationDisplay = '1 tháng';
      if (plan.id === 'yearly') durationDisplay = '12 tháng';

      // Notify mentor
      await createNotification(
        mentor._id,
        '🎉 Thanh toán gói đề xuất thành công!',
        `bạn đã thanh toán thành công gói đề xuất ${durationDisplay}, vị trí đã được admin đề xuất.`,
        'success'
      );

      // Notify all admins
      try {
        const admins = await User.find({ role: 'admin', isActive: true });
        await Promise.all(admins.map(admin =>
          createNotification(
            admin._id,
            '💰 Mentor thanh toán gói đề xuất',
            `mentor ${mentor.name} thanh toán thành công gói đề xuất ${durationDisplay}`,
            'success'
          )
        ));
      } catch (e) { console.error('Admin notify error (mentor promotion):', e); }

      return res.status(200).json({
        success: true,
        message: 'Mentor promotion payment confirmed',
      });
    }

    const order = transaction.orderId;
    console.log('[SePay] Order found:', order?._id);
    console.log('[SePay] Order totalAmount:', order?.totalAmount);
    console.log('[SePay] Order paymentStatus:', order?.paymentStatus);

    if (!order || order.paymentStatus === 'paid') {
      console.log('[SePay] Order already processed or not found');
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    if (!Number.isFinite(receivedAmount) || Math.round(receivedAmount) !== Math.round(order.totalAmount)) {
      console.warn('[SePay] Amount mismatch:', receivedAmount, '| Expected:', order.totalAmount);
      return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    const expectedAccountNumber = `${process.env.SEPAY_ACCOUNT_NUMBER || ''}`.trim();
    const actualAccountNumber = `${accountNumber || ''}`.trim();
    const actualSubAccount = `${subAccount || ''}`.trim();
    
    // Kiểm tra nếu cấu hình SEPAY_ACCOUNT_NUMBER khác với CẢ accountNumber (TK chính) VÀ subAccount (TK ảo)
    if (expectedAccountNumber) {
      if (actualAccountNumber !== expectedAccountNumber && actualSubAccount !== expectedAccountNumber) {
        console.warn('[SePay] Account mismatch:', actualAccountNumber, '| SubAccount:', actualSubAccount, '| Expected:', expectedAccountNumber);
        return res.status(400).json({ success: false, message: 'Account mismatch' });
      }
    }

    // Cập nhật Payment
    if (payment) {
      payment.status = 'completed';
      payment.paymentStatus = 'paid';
      const currentSepayData = payment.sepayData && typeof payment.sepayData.toObject === 'function' ? payment.sepayData.toObject() : (payment.sepayData || {});
      payment.sepayData = {
        ...currentSepayData,
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

    // Cập nhật Order — chờ admin kích hoạt
    order.status = 'processing';
    order.paymentStatus = 'paid';
    await order.save();
    console.log('[SePay] Order updated:', order._id, '| Status: processing (pending admin activation)');

    // Cập nhật Transaction
    transaction.status = 'completed';
    // Lưu SePay transaction code riêng (không đổi transactionCode gốc để frontend polling tìm được)
    transaction.providerTransactionCode = `SEPAY_${transactionCode}`;
    await transaction.save();
    console.log('[SePay] Transaction updated:', transaction._id, '| Status:', transaction.status);

    console.log('[SePay] Skipping downloadHistory — will be activated by admin');

    // Thông báo cho student — chờ admin kích hoạt
    await createNotification(
      order.user,
      'Thanh toán thành công! Đang chờ kích hoạt',
      'Chúng tôi đã nhận được thanh toán của bạn. Tài liệu sẽ được kích hoạt sau khi admin xét duyệt (thường trong vài giờ).',
      'info'
    );

    // Thông báo cho admin — cần kích hoạt tài liệu
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      await Promise.all(admins.map(admin =>
        createNotification(
          admin._id,
          '🔔 Có đơn hàng cần kích hoạt tài liệu',
          `Nhận ${Number(receivedAmount).toLocaleString('vi-VN')} VNĐ từ SePay. Nội dung: ${rawContent}. Vào /admin/payments để kích hoạt tài liệu cho học viên.`,
          'warning'
        )
      ));
    } catch (e) { console.error('Admin notify error:', e); }

    return res.status(200).json({ success: true, message: 'Payment confirmed, pending admin activation' });

  } catch (error) {
    console.error('[SePay webhook] Unhandled error:', error);
    return res.status(200).json({ success: false, message: 'Internal error' });
  }
});

// â”€â”€â”€ Get payment status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Check payment by transaction code (polling) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/check/:transactionCode', async (req, res, next) => {
  try {
    const { transactionCode } = req.params;
    console.log('[Check] Looking for transaction:', transactionCode);

    const populateOrder = {
      path: 'orderId',
      populate: { path: 'documents.document', model: 'Document' }
    };

    const completedTransaction = await Transaction.findOne({
      transactionCode,
      paymentMethod: 'sepay',
      status: 'completed'
    }).sort({ createdAt: -1 }).populate(populateOrder);

    const latestTransaction = completedTransaction || await Transaction.findOne({
      transactionCode,
      paymentMethod: 'sepay'
    }).sort({ createdAt: -1 }).populate(populateOrder);

    const transaction = latestTransaction;

    console.log('[Check] Transaction found:', transaction?._id, '| Status:', transaction?.status);

    if (!transaction) return next(apiError('Transaction not found', 404));

    const payment = await Payment.findById(transaction.paymentId);

    res.json(apiSuccess({
      status: transaction.status,
      paymentStatus: transaction.status === 'completed' ? 'paid' : 'pending',
      orderId: transaction.orderId?._id,
      amount: transaction.amount,
      method: transaction.paymentMethod,
      paymentStatusRaw: payment?.paymentStatus,
    }));
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ Debug: Get all pending transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
