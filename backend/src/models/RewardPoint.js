import mongoose from 'mongoose';

const rewardPointSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'refund', 'admin_adjust'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'purchase',          // Khi mua tài liệu
      'badge_reward',       // Khi đạt badge
      'streak_bonus',       // Bonus streak
      'admin_bonus',        // Admin tặng thêm
      'redeem_document',    // Đổi điểm lấy tài liệu
      'refund',             // Hoàn điểm khi refund
      'expired',            // Điểm hết hạn
      'manual_adjust'        // Điều chỉnh thủ công
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  },
  isExpired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

rewardPointSchema.index({ user: 1, createdAt: -1 });
rewardPointSchema.index({ user: 1, type: 1 });
rewardPointSchema.index({ expiresAt: 1, isExpired: 1 });

const RewardPoint = mongoose.model('RewardPoint', rewardPointSchema);

export default RewardPoint;
