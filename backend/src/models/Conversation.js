import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group'], default: 'direct' },
  name: { type: String, default: null },
  avatar: { type: String, default: null },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    content: { type: String, default: '' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, default: 'text' },
    createdAt: { type: Date }
  },
  lastActivity: { type: Date, default: Date.now },
  unreadCount: { type: Map, of: Number, default: {} },
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });

export default mongoose.model('Conversation', ConversationSchema);
