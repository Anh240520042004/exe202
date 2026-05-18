import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { 
  createVNPayUrl, 
  verifyVNPayReturn, 
  createSePayPayment,
} from '../services/paymentService.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import { User } from '../models/index.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import emailService from '../services/emailService.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to create notification
const createNotification = async (userId, title, message, type = 'info') => {
  await Notification.create({
    user: userId,
    title,
    message,
    type
  });
};

// Create payment for an order
router.post('/create', protect, async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'vnpay' } = req.body;

    if (!orderId) {
      return next(apiError('Order ID is required', 400));
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
      return next(apiError('Not authorized', 403));
    }

    if (order.paymentStatus === 'paid') {
      return next(apiError('Order already paid', 400));
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      type: 'document',
      orderId: order._id,
      amount: order.totalAmount,
      method: paymentMethod,
      status: 'pending'
    });

    const transactionId = `FPTAIEZ${order._id?.toString().slice(-8) || Date.now()}`;
    const orderInfo = `Thanh toan tai lieu FPTAIEZ - ${transactionId}`;

    let paymentData;

    if (paymentMethod === 'vnpay') {
      paymentData = createVNPayUrl({
        amount: order.totalAmount,
        orderId: order._id,
        orderInfo,
        transactionId,
      });

      payment.vnpayData = paymentData;
      await payment.save();

      // Update order
      order.paymentId = payment._id;
      order.paymentMethod = 'vnpay';
      await order.save();

      // Create pending transaction
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

      res.json(apiSuccess({
        paymentId: payment._id,
        paymentUrl: paymentData.vnpUrl,
        transactionId,
        method: 'vnpay',
      }, 'VNPay payment URL created'));

    } else if (paymentMethod === 'sepay') {
      paymentData = await createSePayPayment({
        amount: order.totalAmount,
        orderId: order._id,
        orderInfo,
        transactionId,
      });

      payment.sepayData = paymentData;
      await payment.save();

      // Update order
      order.paymentId = payment._id;
      order.paymentMethod = 'sepay';
      await order.save();

      // Create pending transaction
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

      res.json(apiSuccess({
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

// VNPay return URL (from VNPay gateway)
router.get('/vnpay-return', async (req, res, next) => {
  try {
    const result = verifyVNPayReturn(req.query);

    if (result.isSuccess) {
      // Find payment by transaction ID
      const payment = await Payment.findOne({ 
        'vnpayData.vnp_TxnRef': result.vnp_TxnRef 
      }).populate('user').populate({
        path: 'orderId',
        populate: {
          path: 'documents.document',
          model: 'Document'
        }
      });

      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.paymentStatus = 'paid';
        payment.vnpayData.vnp_ResponseCode = result.vnp_ResponseCode;
        payment.vnpayData.vnp_TransactionStatus = result.vnp_TransactionStatus;
        await payment.save();

        // Update order
        const order = await Order.findById(payment.orderId);
        order.status = 'completed';
        order.paymentStatus = 'paid';
        await order.save();

        // Update documents sales count
        for (const item of order.documents) {
          if (!item.document) continue;
          await Document.findByIdAndUpdate(item.document._id || item.document, {
            $inc: { salesCount: 1 }
          });

          // Add to user download history
          await User.findByIdAndUpdate(order.user, {
            $push: {
              'studentProfile.downloadHistory': {
                document: item.document._id || item.document,
                downloadedAt: new Date()
              }
            }
          });
        }

        // Update transaction
        if (order.transactionId) {
          await Transaction.findByIdAndUpdate(order.transactionId, {
            status: 'completed',
            transactionCode: `VNPAY${result.vnp_TxnRef}`
          });
        }

        // Send confirmation email
        try {
          await emailService.sendPaymentConfirmation(payment.user, {
            orderId: order._id,
            amount: payment.amount,
            method: 'vnpay',
            documents: order.documents.map(doc => ({
              title: doc.document?.title || 'Tai lieu'
            })),
            transactionCode: `VNPAY${result.vnp_TxnRef}`,
            paymentDate: new Date()
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        // Notify user
        await createNotification(
          order.user,
          'Thanh toan thanh cong!',
          'Don hang cua ban da duoc xac nhan. Bay gio ban co the tai tai lieu.',
          'success'
        );
      }

      // Redirect to success page
      const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=success&method=vnpay&orderId=${payment?.orderId?._id || ''}&amount=${result.vnp_Amount}`;
      return res.redirect(frontendUrl);
    } else {
      // Payment failed
      const payment = await Payment.findOne({ 
        'vnpayData.vnp_TxnRef': result.vnp_TxnRef 
      });

      if (payment) {
        payment.status = 'failed';
        await payment.save();

        // Update order
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.status = 'failed';
          await order.save();

          // Notify user
          await createNotification(
            order.user,
            'Thanh toan that bai',
            `Thanh toan khong thanh cong. Ma loi: ${result.vnp_ResponseCode}`,
            'error'
          );
        }
      }

      const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=failed&method=vnpay&code=${result.vnp_ResponseCode}`;
      res.redirect(frontendUrl);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=error&method=vnpay`;
    res.redirect(frontendUrl);
  }
});

// VNPay IPN (Instant Payment Notification) - for server-to-server callback
router.post('/vnpay-ipn', async (req, res) => {
  try {
    const result = verifyVNPayReturn(req.query);

    // Respond to VNPay server
    if (result.isSuccess) {
      res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      res.status(200).json({ RspCode: result.vnp_ResponseCode, Message: 'Error' });
    }
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// SePay webhook (for auto-confirmation)
router.post('/sepay-webhook', async (req, res) => {
  try {
    const { transferType, transferAmount, transferContent, fromBankAccount, fromBankName, toBankAccount } = req.body;

    // Extract order info from transfer content
    const orderIdMatch = transferContent?.match(/FPTAIEZ([a-zA-Z0-9]+)/);
    if (!orderIdMatch) {
      return res.status(200).json({ success: false, message: 'Invalid transfer content' });
    }

    const transactionCode = orderIdMatch[0];

    // Find pending order
    const transaction = await Transaction.findOne({ 
      transactionCode,
      status: 'pending',
      paymentMethod: 'sepay'
    }).populate('orderId');

    if (!transaction) {
      return res.status(200).json({ success: false, message: 'Transaction not found' });
    }

    const order = transaction.orderId;
    if (!order || order.paymentStatus === 'paid') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Verify amount matches
    if (transferAmount < order.totalAmount) {
      return res.status(200).json({ success: false, message: 'Amount mismatch' });
    }

    // Update payment
    const payment = await Payment.findById(transaction.paymentId);
    if (payment) {
      payment.status = 'completed';
      payment.paymentStatus = 'paid';
      payment.sepayData = {
        ...payment.sepayData,
        transferType,
        transferAmount,
        transferContent,
        fromBankAccount,
        fromBankName,
        toBankAccount,
        transferredAt: new Date(),
      };
      await payment.save();
    }

    // Update order
    order.status = 'completed';
    order.paymentStatus = 'paid';
    await order.save();

    // Update transaction
    transaction.status = 'completed';
    transaction.transactionCode = `SEPAY${transactionCode}`;
    await transaction.save();

    // Update documents sales count
    for (const item of order.documents) {
      if (!item.document) continue;
      await Document.findByIdAndUpdate(item.document, {
        $inc: { salesCount: 1 }
      });

      // Add to user download history
      await User.findByIdAndUpdate(order.user, {
        $push: {
          'studentProfile.downloadHistory': {
            document: item.document,
            downloadedAt: new Date()
          }
        }
      });
    }

    // Notify user
    await createNotification(
      order.user,
      'Thanh toan thanh cong!',
      'Don hang cua ban da duoc xac nhan. Bay gio ban co the tai tai lieu.',
      'success'
    );

    // Send confirmation email
    try {
      const user = await User.findById(order.user);
      await emailService.sendPaymentConfirmation(user, {
        orderId: order._id,
        amount: transferAmount,
        method: 'sepay',
        documents: order.documents.map(doc => ({
          title: doc.document?.title || 'Tai lieu'
        })),
        transactionCode: `SEPAY${transactionCode}`,
        paymentDate: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(200).json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    console.error('SePay webhook error:', error);
    res.status(200).json({ success: false, message: 'Error processing webhook' });
  }
});

// Get payment status
router.get('/status/:paymentId', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('orderId');

    if (!payment) {
      return next(apiError('Payment not found', 404));
    }

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

// Check payment by transaction code (for polling)
router.get('/check/:transactionCode', protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      transactionCode: req.params.transactionCode,
      user: req.user.id
    }).populate({
      path: 'orderId',
      populate: {
        path: 'documents.document',
        model: 'Document'
      }
    });

    if (!transaction) {
      return next(apiError('Transaction not found', 404));
    }

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

export default router;
