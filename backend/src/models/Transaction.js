import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'salary',
        'investment',
        'food',
        'transport',
        'shopping',
        'bills',
        'entertainment',
        'health',
        'education',
        'document_purchase',
        'mentor_session',
        'subscription',
        'refund',
        'other',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    transactionCode: {
      type: String,
    },
    providerTransactionCode: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['sepay', 'vnpay', 'momo', 'banking', 'credit', 'wallet'],
    },
    items: [{
      itemId: mongoose.Schema.Types.ObjectId,
      itemType: {
        type: String,
        enum: ['document', 'mentor', 'course', 'subscription']
      },
      name: String,
      price: Number,
    }],
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionCode: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
