import bcrypt from 'bcryptjs';
import jwtHelper from '../utils/jwtHelper.js';
import { PendingRegistration, User } from '../models/index.js';
import emailService from './emailService.js';

class AuthService {
  async register(userData) {
    const { name, email, password, role = 'student' } = userData;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email đã được sử dụng' };
    }

    // Create user directly — no email verification required
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      isEmailVerified: true,
    });

    const accessToken = jwtHelper.generateAccessToken(user._id);
    const refreshToken = jwtHelper.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    // Send welcome email (non-blocking)
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(userId, code) {
    const user = await User.findById(userId).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      throw { statusCode: 404, message: 'Khong tim thay nguoi dung' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email da duoc xac thuc truoc do' };
    }

    if (!user.verifyEmailCode(code)) {
      throw { statusCode: 400, message: 'Ma xac thuc khong dung hoac da het han' };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    return { message: 'Xac thuc email thanh cong' };
  }

  async verifyEmailByCode(email, code) {
    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail })
      .select('+passwordHash +emailVerificationToken');

    if (pending) {
      if (pending.emailVerificationToken !== code || Date.now() > pending.emailVerificationExpire) {
        throw { statusCode: 400, message: 'Ma xac thuc khong dung hoac da het han' };
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw { statusCode: 400, message: 'Email da duoc su dung' };
      }

      const user = await User.create({
        name: pending.name,
        email: pending.email,
        password: pending.passwordHash,
        role: pending.role,
        isEmailVerified: true,
      });

      const accessToken = jwtHelper.generateAccessToken(user._id);
      const refreshToken = jwtHelper.generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();
      await PendingRegistration.deleteOne({ _id: pending._id });

      try {
        await emailService.sendWelcomeEmail(user);
      } catch (err) {
        console.error('Failed to send welcome email:', err);
      }

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      throw { statusCode: 404, message: 'Khong tim thay dang ky cho email nay' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email da duoc xac thuc truoc do' };
    }

    if (!user.verifyEmailCode(code)) {
      throw { statusCode: 400, message: 'Ma xac thuc khong dung hoac da het han' };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    return { message: 'Xac thuc email thanh cong' };
  }

  async resendVerificationCode(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (pending) {
      const verificationCode = emailService.generateVerificationCode();
      pending.emailVerificationToken = verificationCode;
      pending.emailVerificationExpire = new Date(Date.now() + 5 * 60 * 1000);
      await pending.save();

      await emailService.sendEmailVerification(pending, verificationCode);
      return { message: 'Ma xac thuc moi da duoc gui' };
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw { statusCode: 404, message: 'Email khong ton tai hoac chua dang ky' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email da duoc xac thuc truoc do' };
    }

    const verificationCode = user.getEmailVerificationToken();
    await user.save();

    await emailService.sendEmailVerification(user, verificationCode);

    return { message: 'Ma xac thuc moi da duoc gui' };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw { statusCode: 401, message: 'Email hoac mat khau khong dung' };
    }

    if (!user.isActive) {
      throw { statusCode: 401, message: 'Tai khoan da bi vo hieu hoa' };
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Email hoac mat khau khong dung' };
    }

    const accessToken = jwtHelper.generateAccessToken(user._id);
    const refreshToken = jwtHelper.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.activities = user.activities || [];
    user.activities.unshift({
      type: 'login',
      description: 'Dang nhap vao he thong',
      createdAt: new Date(),
    });

    await user.save();

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
    return { message: 'Dang xuat thanh cong' };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: 401, message: 'Refresh token khong hop le' };
    }

    const decoded = jwtHelper.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw { statusCode: 401, message: 'Refresh token khong hop le' };
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
      throw { statusCode: 404, message: 'Email khong ton tai' };
    }

    const resetToken = user.getResetPasswordToken();
    await user.save();

    await emailService.sendPasswordResetEmail(user, resetToken);

    return { message: 'Email dat lai mat khau da duoc gui' };
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Token khong hop le hoac da het han' };
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'Mat khau da duoc dat lai thanh cong' };
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
