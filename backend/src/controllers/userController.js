import { User, Settings, Order, Payment } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import jwtHelper from '../utils/jwtHelper.js';

class UserController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user?._id;
      console.log('Fetching profile for user:', userId);
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const profile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        activities: user.activities?.slice(0, 20) || [],
      };
      console.log('Profile found:', profile.name);
      
      return res.json({ success: true, message: 'Lấy thông tin thành công', data: profile });
    } catch (error) {
      console.error('getProfile error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, avatar } = req.body;
      const updates = {};
      
      if (name) updates.name = name;
      if (avatar !== undefined) updates.avatar = avatar;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );
      
      // Log activity
      user.activities = user.activities || [];
      user.activities.unshift({
        type: 'profile_update',
        description: 'Cập nhật hồ sơ cá nhân',
        createdAt: new Date()
      });
      await user.save();

      ApiResponse.success(res, this.sanitizeUser(user), 'Cập nhật thành công');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select('+password');
      
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return ApiResponse.badRequest(res, 'Mật khẩu hiện tại không đúng');
      }

      user.password = newPassword;
      user.refreshToken = null;
      await user.save();

      const accessToken = jwtHelper.generateAccessToken(user._id);
      const refreshToken = jwtHelper.generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      ApiResponse.success(res, { accessToken, refreshToken }, 'Đổi mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      let settings = await Settings.findOne({ user: req.user._id });
      
      if (!settings) {
        settings = await Settings.create({ user: req.user._id });
      }

      ApiResponse.success(res, settings, 'Lấy cài đặt thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await Settings.findOneAndUpdate(
        { user: req.user._id },
        { preferences: req.body },
        { new: true, upsert: true, runValidators: true }
      );

      ApiResponse.success(res, settings, 'Cập nhật cài đặt thành công');
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [orders, total] = await Promise.all([
        Order.find({ user: userId })
          .populate('documents.document', 'title previewImages')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Order.countDocuments({ user: userId }),
      ]);

      ApiResponse.paginated(res, orders, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy lịch sử mua hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [payments, total] = await Promise.all([
        Payment.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Payment.countDocuments({ user: userId }),
      ]);

      ApiResponse.paginated(res, payments, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy lịch sử thanh toán thành công');
    } catch (error) {
      next(error);
    }
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

export default new UserController();
