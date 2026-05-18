import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documents: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    price: Number,
    downloaded: { type: Boolean, default: false },
    downloadedAt: Date
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['vnpay', 'momo', 'banking', 'credit'],
    default: 'vnpay'
  },
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  couponCode: String,
  discountAmount: {
    type: Number,
    default: 0
  },
  expiresAt: Date
}, {
  timestamps: true
});

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
