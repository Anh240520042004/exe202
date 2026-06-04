import { Transaction } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/security.js';

class TransactionController {
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        status,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query = { user: req.user._id };

      if (type) query.type = type;
      if (category) query.category = category;
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      if (search) {
        query.description = { $regex: escapeRegex(search), $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort(sort)
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

  async getById(req, res, next) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!transaction) {
        return ApiResponse.notFound(res, 'Không tìm thấy giao dịch');
      }

      ApiResponse.success(res, transaction, 'Lấy giao dịch thành công');
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const transaction = await Transaction.create({
        ...req.body,
        user: req.user._id,
      });

      ApiResponse.created(res, transaction, 'Tạo giao dịch thành công');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return ApiResponse.notFound(res, 'Không tìm thấy giao dịch');
      }

      ApiResponse.success(res, transaction, 'Cập nhật giao dịch thành công');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!transaction) {
        return ApiResponse.notFound(res, 'Không tìm thấy giao dịch');
      }

      ApiResponse.success(res, null, 'Xóa giao dịch thành công');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const userId = req.user._id;
      const { startDate, endDate } = req.query;

      const dateFilter = { user: userId };
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.$gte = new Date(startDate);
        if (endDate) dateFilter.date.$lte = new Date(endDate);
      }

      const [totalIncome, totalExpense, byCategory, recent] = await Promise.all([
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'income' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'expense' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, type: { $in: ['income', 'expense'] } } },
          {
            $group: {
              _id: { category: '$category', type: '$type' },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        Transaction.find({ user: userId })
          .sort({ date: -1 })
          .limit(5),
      ]);

      ApiResponse.success(res, {
        totalIncome: totalIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
        balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        byCategory,
        recentTransactions: recent,
      }, 'Lấy thống kê thành công');
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
