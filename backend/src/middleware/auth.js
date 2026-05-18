import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log('Auth Middleware - Token:', token ? 'received (' + token.substring(0, 20) + '...)' : 'NOT received');
  console.log('Auth Middleware - Secret:', config.jwt.accessSecret);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token, truy cập bị từ chối',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    console.log('Auth Middleware - Decoded:', decoded);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền truy cập',
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền truy cập',
    });
  }
};

export const mentor = (req, res, next) => {
  if (req.user && (req.user.role === 'mentor' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Chỉ mentor mới có quyền truy cập',
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Token invalid but continue anyway
    }
  }

  next();
};
