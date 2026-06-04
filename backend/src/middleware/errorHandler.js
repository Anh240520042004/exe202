import config from '../config/index.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} đã tồn tại`;
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join('. ');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === 'CastError') {
    error.message = 'ID không hợp lệ';
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token không hợp lệ';
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token đã hết hạn';
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Lỗi server',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy: ${req.originalUrl}`);
  error.statusCode = 404;
  res.status(404);
  next(error);
};

export default errorHandler;
