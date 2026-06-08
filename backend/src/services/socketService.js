import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { JWT_ACCESS_SECRET } from '../utils/jwtHelper.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (config.isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`[Socket] User connected: ${socket.userId}`);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // Mark user online
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Join conversation rooms
    const conversations = await Conversation.find({ participants: socket.userId });
    conversations.forEach(conv => {
      socket.join(`conv:${conv._id}`);
    });

    // Emit online status to others
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // ─── Join conversation ───────────────────────────────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // ─── Leave conversation ──────────────────────────────────────
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ─── Send message ─────────────────────────────────────────────
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content, type = 'text', attachmentUrl, attachmentName } = data;
        const trimmedContent = typeof content === 'string' ? content.trim() : '';

        if (!trimmedContent && !attachmentUrl) {
          callback?.({ success: false, message: 'Content or attachment required' });
          return socket.emit('error', { message: 'Content or attachment required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          callback?.({ success: false, message: 'Conversation not found' });
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const participantIds = conversation.participants.map(p => p.toString());
        if (!participantIds.includes(socket.userId)) {
          callback?.({ success: false, message: 'Not authorized' });
          return socket.emit('error', { message: 'Not authorized' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content: trimmedContent,
          type,
          attachmentUrl,
          attachmentName,
          seenBy: [socket.userId],
        });

        const unreadUpdates = participantIds
          .filter(id => id !== socket.userId)
          .reduce((updates, id) => {
            updates[`unreadCount.${id}`] = 1;
            return updates;
          }, {});

        const conversationUpdate = {
          lastMessage: { content: type === 'text' ? trimmedContent : `[${type}]`, sender: socket.userId, type, createdAt: new Date() },
          lastActivity: new Date(),
        };
        if (Object.keys(unreadUpdates).length > 0) {
          conversationUpdate.$inc = unreadUpdates;
        }

        await Conversation.findByIdAndUpdate(conversationId, conversationUpdate);

        const populated = await Message.findById(message._id)
          .populate('sender', 'name avatar')
          .lean();

        let target = io.to(`conv:${conversationId}`);
        participantIds.forEach(id => {
          target = target.to(`user:${id}`);
        });
        target.emit('message:new', populated);
        callback?.({ success: true, data: populated });
      } catch (error) {
        callback?.({ success: false, message: 'Failed to send message' });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing indicator ─────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      });
    });

    // ─── Mark as seen ────────────────────────────────────────────
    socket.on('message:seen', async ({ conversationId, messageId }) => {
      try {
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, { $addToSet: { seenBy: socket.userId } });
        }
        socket.to(`conv:${conversationId}`).emit('message:seen', {
          conversationId,
          userId: socket.userId,
          messageId,
        });
      } catch (error) {
        // ignore
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
