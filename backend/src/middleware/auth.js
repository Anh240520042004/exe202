import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { JWT_ACCESS_SECRET } from '../utils/jwtHelper.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Khong co token, truy cap bi tu choi',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nguoi dung khong ton tai',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tai khoan da bi vo hieu hoa',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Token verify failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token khong hop le hoac da het han',
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
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Token invalid but continue anyway
    }
  }

  next();
};
