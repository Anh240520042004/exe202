import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/index.js';
import { notFound } from './middleware/errorHandler.js';
import errorHandler from './middleware/errorHandler.js';
import { initSocket } from './services/socketService.js';
import {
  authRoutes,
  userRoutes,
  transactionRoutes,
  notificationRoutes,
  dashboardRoutes,
  adminRoutes,
  documentRoutes,
  courseRoutes,
  orderRoutes,
  mentorRoutes,
  aiRoutes,
  gamificationRoutes,
  paymentRoutes,
  rewardRoutes,
  postRoutes,
  conversationRoutes,
  reviewRoutes,
  uploadRoutes,
} from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────
initSocket(server);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (config.isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FPTAIEZ API is running',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FPTAIEZ API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Client URL: ${config.clientUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
