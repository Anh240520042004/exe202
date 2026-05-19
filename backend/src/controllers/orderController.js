import Order from '../models/Order.js';
import Document from '../models/Document.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
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

// Helper function to create notification
const createNotification = async (userId, title, message, type = 'info') => {
  await Notification.create({
    user: userId,
    title,
    message,
    type
  });
};

export const createOrder = async (req, res, next) => {
  try {
    const { documents, paymentMethod = 'vnpay' } = req.body;

    if (!documents || documents.length === 0) {
      return next(apiError('No documents provided', 400));
    }

    const documentIds = documents.map(d => d.documentId || d);
    
    const foundDocuments = await Document.find({
      _id: { $in: documentIds },
      isActive: true
    });

    if (foundDocuments.length !== documentIds.length) {
      return next(apiError('Some documents are not available', 400));
    }

    const existingOrder = await Order.findOne({
      user: req.user.id,
      status: 'pending',
      'documents.document': { $in: documentIds }
    });

    if (existingOrder) {
      return res.json(apiSuccess(existingOrder, 'Existing order found'));
    }

    const orderDocuments = foundDocuments.map(doc => {
      const ordered = documents.find(d => (d.documentId || d) === doc._id.toString());
      return {
        document: doc._id,
        price: doc.price,
        downloaded: false
      };
    });

    const totalAmount = orderDocuments.reduce((sum, d) => sum + d.price, 0);

    const order = await Order.create({
      user: req.user.id,
      documents: orderDocuments,
      totalAmount,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    res.status(201).json(apiSuccess(order, 'Order created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('documents.document', 'title subjectCode previewImages')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json(apiSuccess({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

// Get student's purchased documents (paid orders)
export const getMyDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { user: req.user.id, paymentStatus: 'paid' };

    // Get all paid orders with populated documents (no pagination at DB level first)
    const allOrders = await Order.find(query)
      .populate('documents.document', 'title subjectCode price previewImages fileUrl downloads isActive fileType fileSize pageCount author')
      .sort({ createdAt: -1 });

    // Flatten documents from all orders
    let allDocuments = [];
    allOrders.forEach(order => {
      order.documents.forEach(item => {
        if (item.document && item.document.isActive) {
          allDocuments.push({
            _id: item._id,
            document: item.document,
            orderId: order._id,
            orderDate: order.createdAt,
            price: item.price,
            downloaded: item.downloaded,
            downloadedAt: item.downloadedAt
          });
        }
      });
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allDocuments = allDocuments.filter(item =>
        item.document.title.toLowerCase().includes(searchLower) ||
        item.document.subjectCode?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalDocs = allDocuments.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedDocs = allDocuments.slice(skip, skip + Number(limit));

    res.json(apiSuccess({
      documents: paginatedDocs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalDocs,
        pages: Math.ceil(totalDocs / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('documents.document');

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    res.json(apiSuccess(order));
  } catch (error) {
    next(error);
  }
};

export const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod = 'vnpay' } = req.body;

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

    const payment = await Payment.create({
      user: req.user.id,
      type: 'document',
      orderId: order._id,
      amount: order.totalAmount,
      method: paymentMethod,
      status: 'pending'
    });

    let paymentUrl = '';

    if (paymentMethod === 'vnpay') {
      const vnpayData = generateVNPayUrl(payment);
      payment.vnpayData = vnpayData;
      await payment.save();
      paymentUrl = vnpayData.vnpUrl;
    } else if (paymentMethod === 'momo') {
      const momoData = generateMomoUrl(payment);
      payment.momoData = momoData;
      await payment.save();
      paymentUrl = momoData.momoUrl;
    }

    order.paymentMethod = paymentMethod;
    order.paymentId = payment._id;
    await order.save();

    res.json(apiSuccess({ order, payment, paymentUrl }, 'Payment initiated'));
  } catch (error) {
    next(error);
  }
};

export const handleVNPayCallback = async (req, res, next) => {
  try {
    const { vnp_ResponseCode, vnp_TransactionStatus, vnp_TxnRef } = req.query;

    const payment = await Payment.findOne({ 'vnpayData.vnp_TxnRef': vnp_TxnRef })
      .populate('user')
      .populate({
        path: 'orderId',
        populate: {
          path: 'documents.document',
          model: 'Document'
        }
      });

    if (!payment) {
      return next(apiError('Payment not found', 404));
    }

    payment.vnpayData.vnp_ResponseCode = vnp_ResponseCode;
    payment.vnpayData.vnp_TransactionStatus = vnp_TransactionStatus;

    if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
      payment.status = 'completed';
      payment.paymentStatus = 'paid';

      const order = await Order.findById(payment.orderId);
      order.status = 'completed';
      order.paymentStatus = 'paid';
      await order.save();

      // Update documents sales count
      for (const item of order.documents) {
        await Document.findByIdAndUpdate(item.document, {
          $inc: { salesCount: 1 }
        });

        await mongoose.model('User').findByIdAndUpdate(order.user, {
          $push: {
            'studentProfile.downloadHistory': {
              document: item.document,
              downloadedAt: new Date()
            }
          }
        });
      }

      // Create transaction record
      const transaction = await Transaction.create({
        user: payment.user._id,
        amount: payment.amount,
        type: 'expense',
        category: 'document_purchase',
        description: `Thanh toán tài liệu - Mã đơn: ${order._id}`,
        status: 'completed',
        orderId: order._id,
        paymentId: payment._id,
        transactionCode: `VNPAY${vnp_TxnRef}`,
        paymentMethod: 'vnpay',
        items: order.documents.map(doc => ({
          itemId: doc.document._id,
          itemType: 'document',
          name: doc.document?.title || 'Tài liệu',
          price: doc.price
        }))
      });

      // Update order with transaction ID
      order.transactionId = transaction._id;
      await order.save();

      // Send payment confirmation email
      try {
        const documents = order.documents.map(doc => ({
          title: doc.document?.title || 'Tài liệu'
        }));

        await emailService.sendPaymentConfirmation(payment.user, {
          orderId: order._id,
          amount: payment.amount,
          method: 'vnpay',
          documents,
          transactionCode: `VNPAY${vnp_TxnRef}`,
          paymentDate: new Date()
        });
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }

      // Award reward points for purchase
      try {
        const pointsEarned = await earnPoints(
          order.user.toString(),
          payment.amount,
          order._id
        );
        if (pointsEarned) {
          await createNotification(
            order.user.toString(),
            'Nhận điểm thưởng!',
            `Bạn đã nhận được ${pointsEarned.points} điểm thưởng khi mua tài liệu!`,
            'success'
          );
        }
      } catch (pointError) {
        console.error('Failed to award points:', pointError);
      }

      // Redirect to frontend with success status
      const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=success&orderId=${order._id}`;
      res.redirect(frontendUrl);
    } else {
      payment.status = 'failed';
      await payment.save();

      // Send payment failed email
      try {
        await emailService.sendPaymentFailedNotification(payment.user, {
          orderId: payment.orderId,
          amount: payment.amount,
          reason: `Mã lỗi: ${vnp_ResponseCode}`
        });
      } catch (emailError) {
        console.error('Failed to send payment failed email:', emailError);
      }

      const frontendUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result?status=failed&code=${vnp_ResponseCode}`;
      res.redirect(frontendUrl);
    }
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('user')
      .populate({
        path: 'orderId',
        populate: {
          path: 'documents.document',
          model: 'Document'
        }
      });
      
    if (!payment) {
      return next(apiError('Payment not found', 404));
    }

    payment.status = 'completed';
    payment.transactionId = transactionId || `MANUAL${Date.now()}`;
    payment.paymentStatus = 'paid';
    await payment.save();

    const order = await Order.findById(payment.orderId);
    order.status = 'completed';
    order.paymentStatus = 'paid';
    order.transactionId = payment._id;
    await order.save();

    // Update documents sales count
    for (const item of order.documents) {
      await Document.findByIdAndUpdate(item.document, {
        $inc: { salesCount: 1 }
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: payment.user._id,
      amount: payment.amount,
      type: 'expense',
      category: 'document_purchase',
      description: `Thanh toán tài liệu - Mã đơn: ${order._id}`,
      status: 'completed',
      orderId: order._id,
      paymentId: payment._id,
      transactionCode: transactionId || `MANUAL${Date.now()}`,
      paymentMethod: payment.method || 'banking',
      items: order.documents.map(doc => ({
        itemId: doc.document?._id || doc.document,
        itemType: 'document',
        name: doc.document?.title || 'Tài liệu',
        price: doc.price
      }))
    });

    // Update order with transaction ID
    order.transactionId = transaction._id;
    await order.save();

    // Send payment confirmation email
    try {
      const documents = order.documents.map(doc => ({
        title: doc.document?.title || 'Tài liệu'
      }));

      await emailService.sendPaymentConfirmation(payment.user, {
        orderId: order._id,
        amount: payment.amount,
        method: payment.method || 'banking',
        documents,
        transactionCode: transactionId || `MANUAL${Date.now()}`,
        paymentDate: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }

    // Award reward points for purchase
    try {
      const pointsEarned = await earnPoints(
        order.user.toString(),
        payment.amount,
        order._id
      );
      if (pointsEarned) {
        await createNotification(
          order.user.toString(),
          'Nhận điểm thưởng!',
          `Bạn đã nhận được ${pointsEarned.points} điểm thưởng khi mua tài liệu!`,
          'success'
        );
      }
    } catch (pointError) {
      console.error('Failed to award points:', pointError);
    }

    res.json(apiSuccess(order, 'Payment confirmed'));
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const { orderId, documentId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
      return next(apiError('Not authorized', 403));
    }

    if (order.paymentStatus !== 'paid') {
      return next(apiError('Order not paid', 400));
    }

    const orderItem = order.documents.find(
      d => d.document.toString() === documentId
    );

    if (!orderItem) {
      return next(apiError('Document not in order', 404));
    }

    const now = new Date();
    orderItem.downloaded = true;
    orderItem.downloadedAt = now;
    await order.save();

    const document = await Document.findById(documentId);
    await Document.findByIdAndUpdate(documentId, { $inc: { downloads: 1 } });

    // Add to user's download history
    const user = await mongoose.model('User').findById(req.user.id);
    if (user && user.studentProfile) {
      // Check if already in history
      const existingIndex = user.studentProfile.downloadHistory?.findIndex(
        h => h.document?.toString() === documentId
      );

      if (existingIndex !== undefined && existingIndex >= 0) {
        // Update existing entry
        user.studentProfile.downloadHistory[existingIndex].downloadedAt = now;
      } else {
        // Add new entry
        if (!user.studentProfile.downloadHistory) {
          user.studentProfile.downloadHistory = [];
        }
        user.studentProfile.downloadHistory.unshift({
          document: documentId,
          downloadedAt: now,
          orderId: orderId
        });
      }
      await user.save();
    }

    res.json(apiSuccess({
      downloadUrl: document.fileUrl,
      title: document.title,
      fileName: document.fileName || document.title
    }, 'Document ready for download'));
  } catch (error) {
    next(error);
  }
};

function generateVNPayUrl(payment) {
  const vnp_TxnRef = Date.now();
  const vnp_Amount = payment.amount * 100;
  const vnpUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?amount=${vnp_Amount}&order=${vnp_TxnRef}`;
  
  return {
    vnp_TxnRef: vnp_TxnRef.toString(),
    vnp_Amount: vnp_Amount.toString(),
    vnpUrl,
    vnp_OrderInfo: `Thanh toan don hang ${payment._id}`,
    vnp_Locale: 'vn'
  };
}

function generateMomoUrl(payment) {
  const orderId = `MOMO${Date.now()}`;
  const momoUrl = `https://test-payment.momo.vn/pay/${orderId}`;

  return {
    partnerCode: 'MOMO_TEST',
    orderId,
    requestId: Date.now().toString(),
    amount: payment.amount.toString(),
    momoUrl
  };
}

// VietQR / Banking payment - creates pending transaction
export const initiateBankingPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { transactionId: userTransactionId } = req.body;

    const order = await Order.findById(orderId)
      .populate('documents.document');

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
      return next(apiError('Not authorized', 403));
    }

    if (order.paymentStatus === 'paid') {
      return next(apiError('Order already paid', 400));
    }

    // Create payment record with pending status
    const payment = await Payment.create({
      user: req.user.id,
      type: 'document',
      orderId: order._id,
      amount: order.totalAmount,
      method: 'banking',
      status: 'pending',
      userTransactionId: userTransactionId || null
    });

    // Update order status
    order.paymentMethod = 'banking';
    order.paymentId = payment._id;
    order.status = 'pending';
    order.paymentStatus = 'pending';
    await order.save();

    // Create transaction record with pending status
    const transaction = await Transaction.create({
      user: req.user.id,
      amount: order.totalAmount,
      type: 'expense',
      category: 'document_purchase',
      description: `Yêu cầu thanh toán tài liệu - Mã đơn: ${order._id}`,
      status: 'pending',
      orderId: order._id,
      paymentId: payment._id,
      transactionCode: userTransactionId || `BANK${Date.now()}`,
      paymentMethod: 'banking',
      items: order.documents.map(doc => ({
        itemId: doc.document?._id,
        itemType: 'document',
        name: doc.document?.title || 'Tài liệu',
        price: doc.price
      }))
    });

    // Update order with transaction ID
    order.transactionId = transaction._id;
    await order.save();

    // Notify admin about new pending payment
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'Yêu cầu thanh toán mới',
        `Người dùng ${req.user.name} đã gửi yêu cầu thanh toán ${order.totalAmount.toLocaleString()} VNĐ cho tài liệu.`,
        'warning'
      );
    }

    res.json(apiSuccess({
      order,
      payment,
      transaction,
      message: 'Đã tạo yêu cầu thanh toán. Vui lòng chờ admin xác nhận.'
    }, 'Yêu cầu thanh toán đã được tạo'));
  } catch (error) {
    next(error);
  }
};

// Get all pending payments (Admin only)
export const getPendingPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = { status: 'pending', paymentStatus: 'pending' };

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email avatar')
        .populate('documents.document', 'title subjectCode price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json(apiSuccess({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

// Approve payment (Admin only)
export const approvePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { adminNotes } = req.body;

    const order = await Order.findById(orderId)
      .populate('documents.document')
      .populate('user');

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.paymentStatus === 'paid') {
      return next(apiError('Order already paid', 400));
    }

    // Check if user exists
    if (!order.user) {
      return next(apiError('Order user not found', 400));
    }

    // Update order status
    order.status = 'completed';
    order.paymentStatus = 'paid';
    await order.save();

    // Update payment
    await Payment.findByIdAndUpdate(order.paymentId, {
      status: 'completed',
      paymentStatus: 'paid',
      adminNotes,
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    // Update transaction to completed
    if (order.transactionId) {
      await Transaction.findByIdAndUpdate(order.transactionId, {
        status: 'completed'
      });
    }

    // Update documents sales count
    for (const item of order.documents) {
      if (!item.document) continue;

      await Document.findByIdAndUpdate(item.document._id, {
        $inc: { salesCount: 1 }
      });

      // Notify document owner (seller)
      if (item.document.owner) {
        const seller = await User.findById(item.document.owner);
        if (seller) {
          await createNotification(
            seller._id,
            'Có người mua tài liệu của bạn',
            `Tài liệu "${item.document.title}" đã được thanh toán thành công.`,
            'success'
          );
        }
      }
    }

    // Notify buyer
    await createNotification(
      order.user._id,
      'Thanh toán được xác nhận!',
      `Đơn hàng của bạn đã được xác nhận. Bây giờ bạn có thể tải tài liệu.`,
      'success'
    );

    // Send confirmation email
    try {
      await emailService.sendPaymentConfirmation(order.user, {
        orderId: order._id,
        amount: order.totalAmount,
        method: 'banking',
        documents: order.documents.map(doc => ({
          title: doc.document?.title || 'Tài liệu'
        })),
        transactionCode: order.transactionId?.toString() || `BANK${Date.now()}`,
        paymentDate: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Award reward points for purchase
    try {
      const pointsEarned = await earnPoints(
        order.user._id.toString(),
        order.totalAmount,
        order._id
      );
      if (pointsEarned) {
        await createNotification(
          order.user._id.toString(),
          'Nhận điểm thưởng!',
          `Bạn đã nhận được ${pointsEarned.points} điểm thưởng khi mua tài liệu!`,
          'success'
        );
      }
    } catch (pointError) {
      console.error('Failed to award points:', pointError);
    }

    res.json(apiSuccess(order, 'Payment approved successfully'));
  } catch (error) {
    next(error);
  }
};

// Reject payment (Admin only)
export const rejectPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId)
      .populate('user');

    if (!order) {
      return next(apiError('Order not found', 404));
    }

    if (order.paymentStatus === 'paid') {
      return next(apiError('Cannot reject paid order', 400));
    }

    // Check if user exists
    if (!order.user) {
      return next(apiError('Order user not found', 400));
    }

    // Update payment status
    if (order.paymentId) {
      await Payment.findByIdAndUpdate(order.paymentId, {
        status: 'failed',
        adminNotes: reason,
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
    }

    // Update order
    order.status = 'failed';
    order.paymentStatus = 'failed';
    await order.save();

    // Update transaction
    if (order.transactionId) {
      await Transaction.findByIdAndUpdate(order.transactionId, {
        status: 'failed'
      });
    }

    // Notify buyer
    await createNotification(
      order.user._id,
      'Thanh toán bị từ chối',
      `Yêu cầu thanh toán của bạn đã bị từ chối. Lý do: ${reason || 'Không có lý do được cung cấp'}`,
      'error'
    );

    res.json(apiSuccess(order, 'Payment rejected'));
  } catch (error) {
    next(error);
  }
};
