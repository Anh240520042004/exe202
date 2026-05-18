import authService from '../services/authService.js';
import ApiResponse from '../utils/apiResponse.js';
import emailService from '../services/emailService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      ApiResponse.created(res, result, 'Đăng ký thành công');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { code, email } = req.body;
      const result = await authService.verifyEmailByCode(email, code);
      
      ApiResponse.success(res, result, 'Xác thực email thành công. Vui lòng đăng nhập.');
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationCode(email);
      ApiResponse.success(res, result, 'Mã xác thực mới đã được gửi');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      ApiResponse.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout(req.user._id);
      ApiResponse.success(res, result, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      ApiResponse.success(res, result, 'Token đã được làm mới');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      ApiResponse.success(res, result, 'Email đặt lại mật khẩu đã được gửi');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      ApiResponse.success(res, result, 'Mật khẩu đã được đặt lại');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
