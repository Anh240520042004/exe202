import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxLength: 2000 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ parent: 1 });

export default mongoose.model('Comment', CommentSchema);
