import { Order, Transaction } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/security.js';

const buildAdminTransactionQuery = ({ category, status, search }) => {
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { description: { $regex: escapeRegex(search), $options: 'i' } },
      { transactionCode: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  return query;
};

const getAdminTransactionStats = async (query) => {
  const [transactionStats, paidOrderRevenue] = await Promise.all([
    Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const stats = transactionStats[0];

  return {
    totalTransactions: stats?.totalTransactions || 0,
    completedTransactions: stats?.completedTransactions || 0,
    pendingTransactions: stats?.pendingTransactions || 0,
    completedRevenue: paidOrderRevenue[0]?.total || 0,
  };
};

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

  // Admin: get ALL transactions with user info populated
  async getAllAdmin(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query = buildAdminTransactionQuery({ category, status, search });
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const skip = (pageNumber - 1) * pageSize;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [transactions, total, stats] = await Promise.all([
        Transaction.find(query)
          .populate('user', 'name email role avatar')
          .sort(sort)
          .skip(skip)
          .limit(pageSize),
        Transaction.countDocuments(query),
        getAdminTransactionStats(query),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Lấy toàn bộ giao dịch thành công',
        data: transactions,
        stats,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          itemsPerPage: pageSize,
          hasNextPage: pageNumber < Math.ceil(total / pageSize),
          hasPrevPage: pageNumber > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // User/Mentor: get their own payment transactions (purchases, top suggestions, donations)
  async getMyPayments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Chỉ 3 loại giao dịch thanh toán hợp lệ trên hệ thống:
      // document_purchase: User mua tài liệu (đã có)
      // top_suggestion:   Mentor trả gói ưu tiên đề xuất (sắp ra)
      // donate:           Mentor donate cho nền tảng (sắp ra)
      const PAYMENT_CATEGORIES = ['document_purchase', 'top_suggestion', 'donate'];

      const query = { user: req.user._id };

      if (category) {
        // Validate: chỉ cho phép lọc theo các category hợp lệ
        if (!PAYMENT_CATEGORIES.includes(category)) {
          return ApiResponse.badRequest(res, 'Loại giao dịch không hợp lệ');
        }
        query.category = category;
      } else {
        query.category = { $in: PAYMENT_CATEGORIES };
      }

      if (status) query.status = status;

      if (search) {
        query['$or'] = [
          { description: { $regex: escapeRegex(search), $options: 'i' } },
          { transactionCode: { $regex: escapeRegex(search), $options: 'i' } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .populate('user', 'name email role avatar')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Transaction.countDocuments(query),
      ]);

      ApiResponse.paginated(res, transactions, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy lịch sử thanh toán thành công');
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

  // Admin: bulk delete transactions by IDs
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return ApiResponse.badRequest(res, 'Vui lòng cung cấp danh sách ID cần xóa');
      }

      const result = await Transaction.deleteMany({ _id: { $in: ids } });

      ApiResponse.success(res, { deletedCount: result.deletedCount }, `Đã xóa ${result.deletedCount} giao dịch thành công`);
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
