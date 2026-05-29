import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  count: { type: Number, default: 0 },
  trending: { type: Boolean, default: false },
}, { timestamps: true });

tagSchema.index({ count: -1 });
tagSchema.index({ trending: -1, count: -1 });

export default mongoose.model('Tag', tagSchema);
