import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['document', 'mentor'],
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND'
  },
  method: {
    type: String,
    enum: ['sepay', 'vnpay', 'momo', 'banking', 'credit'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  userTransactionId: {
    type: String,
    description: 'User-entered bank transaction ID for manual verification'
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  vnpayData: {
    vnp_Amount: String,
    vnp_BankCode: String,
    vnp_CardType: String,
    vnp_OrderInfo: String,
    vnp_PayDate: String,
    vnp_TxnRef: String,
    vnp_TransactionNo: String,
    vnp_ResponseCode: String
  },
  momoData: {
    partnerCode: String,
    orderId: String,
    requestId: String,
    amount: String,
    transId: String,
    responseTime: String
  },
  sepayData: {
    sepayOrderId: String,
    qrUrl: String,
    qrRaw: String,
    amount: Number,
    orderInfo: String,
    transactionId: String,
    provider: String,
    bankInfo: {
      bankBin: String,
      bankCode: String,
      accountNumber: String,
      accountName: String,
      bankName: String,
    },
    instructions: [String],
    sepayId: String,
    gateway: String,
    transferType: String,
    transferAmount: Number,
    transferContent: String,
    accountNumber: String,
    subAccount: String,
    referenceCode: String,
    transferredAt: Date,
  },
  mentorPromotion: {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    planId: String,
    planName: String,
    days: Number,
    priorityScore: Number,
    campaignName: String,
  },
  // Admin approval fields
  adminNotes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundedAt: Date
}, {
  timestamps: true
});

paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
