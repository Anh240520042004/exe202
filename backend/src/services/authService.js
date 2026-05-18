import jwtHelper from '../utils/jwtHelper.js';
import { User } from '../models/index.js';
import emailService from './emailService.js';

class AuthService {
  async register(userData) {
    const { name, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email đã được sử dụng' };
    }

    const user = await User.create({ name, email, password });

    // Generate verification token but DON'T auto-verify
    const verificationCode = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendEmailVerification(user, verificationCode);
    } catch (err) {
      console.log('Email verification email could not be sent:', err.message);
    }

    return {
      requiresEmailVerification: true,
      email: user.email,
      message: 'Đăng ký thành công. Vui lòng xác thực email.'
    };
  }

  async verifyEmail(userId, code) {
    const user = await User.findById(userId).select('+emailVerificationToken +emailVerificationExpire');
    
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email đã được xác thực trước đó' };
    }

    if (!user.verifyEmailCode(code)) {
      throw { statusCode: 400, message: 'Mã xác thực không đúng hoặc đã hết hạn' };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    return { message: 'Xác thực email thành công' };
  }

  async verifyEmailByCode(email, code) {
    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpire');
    
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email đã được xác thực trước đó' };
    }

    if (!user.verifyEmailCode(code)) {
      throw { statusCode: 400, message: 'Mã xác thực không đúng hoặc đã hết hạn' };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return { message: 'Xác thực email thành công' };
  }

  async resendVerificationCode(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw { statusCode: 404, message: 'Email không tồn tại' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email đã được xác thực trước đó' };
    }

    const verificationCode = user.getEmailVerificationToken();
    await user.save();

    try {
      await emailService.sendEmailVerification(user, verificationCode);
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    return { message: 'Mã xác thực mới đã được gửi' };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' };
    }

    if (!user.isActive) {
      throw { statusCode: 401, message: 'Tài khoản đã bị vô hiệu hóa' };
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' };
    }

    const accessToken = jwtHelper.generateAccessToken(user._id);
    const refreshToken = jwtHelper.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    
    // Log activity
    user.activities = user.activities || [];
    user.activities.unshift({
      type: 'login',
      description: 'Đăng nhập vào hệ thống',
      createdAt: new Date()
    });
    
    await user.save();

    // Update study streak for students (async)
    if (user.role === 'student') {
      const { updateStreak } = await import('../controllers/gamificationController.js');
      setImmediate(() => updateStreak(user._id));
    }

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return { message: 'Đăng xuất thành công' };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: 401, message: 'Refresh token không hợp lệ' };
    }

    const decoded = jwtHelper.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw { statusCode: 401, message: 'Refresh token không hợp lệ' };
    }

    const newAccessToken = jwtHelper.generateAccessToken(user._id);
    const newRefreshToken = jwtHelper.generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw { statusCode: 404, message: 'Email không tồn tại' };
    }

    const resetToken = user.getResetPasswordToken();
    await user.save();

    await this.sendPasswordResetEmail(user, resetToken);

    return { message: 'Email đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Token không hợp lệ hoặc đã hết hạn' };
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'Mật khẩu đã được đặt lại thành công' };
  }

  sanitizeUser(user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
