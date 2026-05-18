import { Notification } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';

class NotificationController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, isRead } = req.query;

      const query = { user: req.user._id };
      if (isRead !== undefined) {
        query.isRead = isRead === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Notification.countDocuments(query),
        Notification.countDocuments({ user: req.user._id, isRead: false }),
      ]);

      ApiResponse.paginated(res, {
        notifications,
        unreadCount,
      }, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      }, 'Lấy thông báo thành công');
    } catch (error) {
      next(error);
    }
  }

  async getUnread(req, res, next) {
    try {
      const notifications = await Notification.find({
        user: req.user._id,
        isRead: false,
      }).sort({ createdAt: -1 });

      ApiResponse.success(res, notifications, 'Lấy thông báo chưa đọc thành công');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
      }

      ApiResponse.success(res, notification, 'Đã đánh dấu đã đọc');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
      );

      ApiResponse.success(res, null, 'Đã đánh dấu tất cả đã đọc');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!notification) {
        return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
      }

      ApiResponse.success(res, null, 'Xóa thông báo thành công');
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const notification = await Notification.create({
        ...req.body,
        user: req.user._id,
      });

      ApiResponse.created(res, notification, 'Tạo thông báo thành công');
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
