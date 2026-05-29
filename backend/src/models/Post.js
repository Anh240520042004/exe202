import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxLength: 200, trim: true },
  content: { type: String, required: true, maxLength: 10000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, lowercase: true, trim: true }],
  images: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false }, // admin-hidden posts
  hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  hiddenReason: { type: String, default: null },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

PostSchema.index({ isDeleted: 1, isHidden: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ likeCount: -1, commentCount: -1 });

export default mongoose.model('Post', PostSchema);
