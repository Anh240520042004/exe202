import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../../store/slices/notificationSlice";

import {
  Card,
  Button,
  Badge,
  Skeleton,
  LoginRequired
} from "../../components/ui";

const typeConfig = {
  info: { icon: Info, color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  success: { icon: CheckCircle, color: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  warning: { icon: AlertTriangle, color: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
  error: { icon: AlertCircle, color: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

export default function Notifications() {
  const dispatch = useDispatch();
  const { items: notifications, unreadCount, isLoading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }));
  }, [dispatch]);

  const handleMarkAsRead = async (id) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
      toast.success('Đã đánh dấu đã đọc');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success('Đã đánh dấu tất cả đã đọc');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteNotification(id)).unwrap();
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return notifDate.toLocaleDateString('vi-VN');
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <LoginRequired title="Thông báo" message="Bạn cần đăng nhập để xem thông báo">
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thông báo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Card noPadding>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.info;
              const Icon = config.icon;

              return (
                <div
                  key={notification._id}
                  className={`p-4 glass-nav-hover transition-colors ${!notification.isRead ? 'bg-primary-200/20 dark:bg-primary-400/8' : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${config.bg} ${config.text} mt-1`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-2 glass-nav-hover rounded-xl transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-subtle flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Không có thông báo nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Bạn sẽ nhận được thông báo khi có cập nhật mới
              </p>
            </div>
          )}
        </div>
      </Card>
      </div>
    </LoginRequired>
  );
}
