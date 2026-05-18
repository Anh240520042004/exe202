import { User, Transaction, Settings } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-refreshToken'),
        User.countDocuments(query),
      ]);

      ApiResponse.paginated(res, users, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy danh sách người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id).select('-refreshToken');
      
      if (!user) {
        return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
      }

      const userTransactions = await Transaction.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(10);

      ApiResponse.success(res, { user, transactions: userTransactions }, 'Lấy thông tin người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { name, email, role, isActive } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (email) updates.email = email;
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).select('-refreshToken');

      if (!user) {
        return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
      }

      ApiResponse.success(res, user, 'Cập nhật người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      if (req.params.id === req.user._id.toString()) {
        return ApiResponse.badRequest(res, 'Không thể xóa tài khoản của chính mình');
      }

      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
      }

      await Promise.all([
        Transaction.deleteMany({ user: user._id }),
        Settings.deleteOne({ user: user._id }),
      ]);

      ApiResponse.success(res, null, 'Xóa người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(req, res, next) {
    try {
      const { page = 1, limit = 20, search, type } = req.query;

      const query = {};
      if (search) {
        query.description = { $regex: search, $options: 'i' };
      }
      if (type) query.type = type;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Transaction.countDocuments(query),
      ]);

      ApiResponse.paginated(res, transactions, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
