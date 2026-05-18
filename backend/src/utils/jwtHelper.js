import jwt from 'jsonwebtoken';

class JwtHelper {
  generateAccessToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
      }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

export default new JwtHelper();