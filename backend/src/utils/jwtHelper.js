import jwt from 'jsonwebtoken';

// Centralized JWT secrets with fallbacks — MUST match auth middleware and jwtService
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fptaiez_jwt_access_secret_key_2024_change_in_production';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fptaiez_jwt_refresh_secret_key_2024_change_in_production';

class JwtHelper {
  generateAccessToken(userId) {
    return jwt.sign(
      { id: userId },
      JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

export default new JwtHelper();
