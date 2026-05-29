import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxLength: 1000, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

ReviewSchema.index({ document: 1, createdAt: -1 });
ReviewSchema.index({ document: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', ReviewSchema);
