import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { JWT_ACCESS_SECRET } from '../utils/jwtHelper.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', attachmentUrl, attachmentName } = data;

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content: content || '',
          type,
          attachmentUrl,
          attachmentName,
          seenBy: [socket.userId],
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: { content: type === 'text' ? content : `[${type}]`, sender: socket.userId, type, createdAt: new Date() },
          lastActivity: new Date(),
        });

        const populated = await Message.findById(message._id)
          .populate('sender', 'name avatar')
          .lean();

        io.to(`conv:${conversationId}`).emit('message:new', populated);
      } catch (error) {
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
