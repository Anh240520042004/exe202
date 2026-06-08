import express from 'express';
import { protect } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = express.Router();

// ─── GET /api/conversations ──────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .sort({ lastActivity: -1 })
      .populate('participants', 'name avatar role isOnline lastSeen')
      .populate('lastMessage.sender', 'name avatar')
      .lean();

    const result = conversations.map(conv => {
      const other = conv.participants.filter(p => p._id.toString() !== req.user.id);
      return {
        ...conv,
        displayName: conv.type === 'group' ? conv.name : other[0]?.name || 'Unknown',
        displayAvatar: conv.type === 'group' ? conv.avatar : other[0]?.avatar,
        otherUser: other[0] || null,
        unreadCount: conv.unreadCount?.[req.user.id] || 0,
      };
    });

    return res.json(apiSuccess(result));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/conversations — create/open direct chat ──────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { participantId, type = 'direct', name } = req.body;

    if (type === 'direct') {
      if (!participantId) return next(apiError('participantId required', 400));

      // Cannot chat with yourself
      if (participantId === req.user.id) {
        return next(apiError('Cannot start a conversation with yourself', 400));
      }

      // Check if target user exists
      const targetUser = await User.findById(participantId);
      if (!targetUser) return next(apiError('User not found', 404));

      // Follow check — one direction follow is enough to start a chat
      const [followAtoB, followBtoA] = await Promise.all([
        Follow.findOne({ follower: req.user.id, following: participantId }),
        Follow.findOne({ follower: participantId, following: req.user.id }),
      ]);

      if (!followAtoB && !followBtoA) {
        return next(apiError('Hãy follow hoặc được follow trước để có thể nhắn tin', 403));
      }

      // Return existing conversation if any
      const existing = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [req.user.id, participantId] },
      });

      if (existing) {
        const populated = await Conversation.findById(existing._id)
          .populate('participants', 'name avatar role')
          .lean();
        return res.json(apiSuccess(populated));
      }

      const conversation = await Conversation.create({
        type: 'direct',
        participants: [req.user.id, participantId],
      });

      const populated = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar role')
        .lean();
      return res.status(201).json(apiSuccess(populated));
    }

    // Group chat — anyone can create
    const conversation = await Conversation.create({
      type: 'group',
      name: name || 'Nhóm mới',
      participants: [req.user.id, ...(req.body.participantIds || [])],
    });

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar role')
      .lean();
    return res.status(201).json(apiSuccess(populated));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/conversations/:id ────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name avatar role')
      .lean();

    if (!conversation) return next(apiError('Conversation not found', 404));
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return next(apiError('Not authorized', 403));
    }

    return res.json(apiSuccess(conversation));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/conversations/:id/messages ───────────────────────────────
router.get('/:id/messages', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return next(apiError('Conversation not found', 404));
    if (!conversation.participants.map(p => p.toString()).includes(req.user.id)) {
      return next(apiError('Not authorized', 403));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.id, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('sender', 'name avatar')
        .populate('seenBy', 'name avatar')
        .lean(),
      Message.countDocuments({ conversation: req.params.id, isDeleted: false }),
    ]);

    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${req.user.id}`]: 0,
    });

    return res.json(apiSuccess({
      messages: messages.reverse(),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/conversations/:id/messages ───────────────────────────────
router.post('/:id/messages', protect, async (req, res, next) => {
  try {
    const { content, type = 'text', attachmentUrl, attachmentName } = req.body;
    if (!content?.trim() && !attachmentUrl) {
      return next(apiError('Content or attachment required', 400));
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return next(apiError('Conversation not found', 404));
    if (!conversation.participants.map(p => p.toString()).includes(req.user.id)) {
      return next(apiError('Not authorized', 403));
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      content: content?.trim() || '',
      type,
      attachmentUrl,
      attachmentName,
      seenBy: [req.user.id],
    });

    conversation.lastMessage = {
      content: type === 'text' ? content.trim() : `[${type}]`,
      sender: req.user.id,
      type,
      createdAt: new Date(),
    };
    conversation.lastActivity = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .lean();

    return res.status(201).json(apiSuccess(populated));
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/conversations/:id/read ───────────────────────────────────
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    await Message.updateMany(
      { conversation: req.params.id, seenBy: { $ne: req.user.id } },
      { $addToSet: { seenBy: req.user.id } }
    );

    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${req.user.id}`]: 0,
    });

    return res.json(apiSuccess(null, 'Marked as read'));
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/conversations/:id ────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return next(apiError('Conversation not found', 404));

    // Remove participant from conversation instead of deleting whole chat
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.user.id
    );
    await conversation.save();

    return res.json(apiSuccess(null, 'Left conversation'));
  } catch (error) {
    next(error);
  }
});

export default router;
