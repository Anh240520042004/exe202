import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  attachmentUrl: { type: String, default: null },
  attachmentName: { type: String, default: null },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);
