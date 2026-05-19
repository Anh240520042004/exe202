import mongoose from 'mongoose';

const pointRedemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  pointsSpent: {
    type: Number,
    required: true
  },
  documents: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    pointsCost: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

pointRedemptionSchema.index({ user: 1 });
pointRedemptionSchema.index({ order: 1 });

const PointRedemption = mongoose.model('PointRedemption', pointRedemptionSchema);

export default PointRedemption;
