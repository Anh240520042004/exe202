import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, User, Mail, Lock, Save, Download, BookOpen, Users, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchProfile,
  updateProfile,
  changePassword,
  fetchTransactions,
  fetchTransactionStats
} from "../../store/slices/userSlice";

import {
  Card,
  Button,
  Input,
  Modal,
  ProfileSkeleton,
  LoginRequired
} from "../../components/ui";

const ACTIVITY_ICONS = {
  login: User,
  profile_update: User,
  password_change: Lock,
  download: Download,
  purchase: BookOpen,
  mentor_booking: Users,
  badge_earned: Users,
};

const ACTIVITY_LABELS = {
  login: 'Đăng nhập',
  profile_update: 'Cập nhật hồ sơ',
  password_change: 'Đổi mật khẩu',
  download: 'Tải tài liệu',
  purchase: 'Mua tài liệu',
  mentor_booking: 'Đặt mentor',
  badge_earned: 'Nhận badge',
};

const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const getTransactionIcon = (type) => {
  return type === 'income' ? ArrowUpRight : ArrowDownRight;
};

const getTransactionColor = (type) => {
  return type === 'income' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
};

const getCategoryLabel = (category) => {
  const labels = {
    salary: 'Lương',
    investment: 'Đầu tư',
    food: 'Ăn uống',
    transport: 'Di chuyển',
    shopping: 'Mua sắm',
    bills: 'Hóa đơn',
    entertainment: 'Giải trí',
    health: 'Sức khỏe',
    education: 'Học tập',
    document_purchase: 'Mua tài liệu',
    mentor_session: 'Đặt mentor',
    subscription: 'Đăng ký',
    refund: 'Hoàn tiền',
    other: 'Khác'
  };
  return labels[category] || category;
};

export default function Profile() {
  const dispatch = useDispatch();
  const { profile, isLoading, error, transactions, transactionStats } = useSelector((state) => state.user);
  const user = useSelector((state) => state.auth.user);

  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
  });

  const [activities, setActivities] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        avatar: profile.avatar || '',
      });
      setActivities(profile.activities || []);
    }
  }, [profile]);

  useEffect(() => {
    if (showTransactionHistory && (!transactions || transactions.length === 0)) {
      dispatch(fetchTransactions({ limit: 20 }));
      dispatch(fetchTransactionStats());
    }
  }, [showTransactionHistory, transactions, dispatch]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(updateProfile(profileData)).unwrap();
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err || 'Cập nhật thất bại');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err || 'Đổi mật khẩu thất bại');
    }
  };

  if (isLoading && !profile) {
    return (
      <LoginRequired>
        <div className="space-y-6">
          <Card>
            <ProfileSkeleton />
          </Card>
        </div>
      </LoginRequired>
    );
  }

  return (
    <LoginRequired title="Hồ sơ cá nhân" message="Bạn cần đăng nhập để xem hồ sơ của mình">
      <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={profileData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name}`}
                  alt={profileData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 dark:border-primary-800 mx-auto"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                {profile?.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary-100 dark:bg-primary-400/15 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
                {profile?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t glass-divider border space-y-4">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <User className="w-5 h-5" />
                <span>Tham gia: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail className="w-5 h-5" />
                <span>{profile?.email}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Thông tin cá nhân">
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-4">
                <Input
                  label="Họ tên"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  icon={User}
                />

                <Input
                  label="Avatar URL"
                  name="avatar"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  placeholder="https://..."
                />

                <Input
                  label="Email"
                  value={profile?.email}
                  icon={Mail}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t glass-divider border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                  className="gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Đổi mật khẩu
                </Button>
                <Button type="submit" className="gap-2" isLoading={isLoading}>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Hoạt động gần đây" className="mt-6">
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity, index) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || User;
                  const label = ACTIVITY_LABELS[activity.type] || activity.description || 'Hoạt động';
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 glass-subtle/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-400/15 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                        <p className="text-xs text-gray-500">{getRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                Chưa có hoạt động nào
              </p>
            )}
          </Card>

          {/* Transaction History Section */}
          <Card title="Lịch sử giao dịch" className="mt-6">
            {!showTransactionHistory ? (
              <div className="text-center py-4">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Xem lịch sử các giao dịch mua tài liệu và dịch vụ
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowTransactionHistory(true)}
                  className="gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Xem lịch sử giao dịch
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải lịch sử giao dịch...</p>
              </div>
            ) : (
              <div>
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(transactionStats.totalIncome)}</p>
                    <p className="text-xs text-gray-500">Tổng thu</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(transactionStats.totalExpense)}</p>
                    <p className="text-xs text-gray-500">Tổng chi</p>
                  </div>
                  <div className="bg-primary-200/25 dark:bg-primary-400/10 rounded-xl p-4 text-center">
                    <CreditCard className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                    <p className={`text-2xl font-bold ${transactionStats.balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                      {formatCurrency(transactionStats.balance)}
                    </p>
                    <p className="text-xs text-gray-500">Số dư</p>
                  </div>
                </div>

                {/* Transaction List */}
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((txn) => {
                      const TxnIcon = getTransactionIcon(txn.type);
                      const colorClass = getTransactionColor(txn.type);
                      return (
                        <div key={txn._id} className="flex items-center gap-3 p-3 glass-subtle/50 rounded-xl">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                            <TxnIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {txn.description || getCategoryLabel(txn.category)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {getRelativeTime(txn.date)}
                              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                {getCategoryLabel(txn.category)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              txn.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {txn.status === 'completed' ? 'Hoàn thành' : 
                               txn.status === 'pending' ? 'Đang xử lý' : 
                               txn.status === 'failed' ? 'Thất bại' : 'Đã hủy'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Chưa có giao dịch nào
                    </p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransactionHistory(false)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Đổi mật khẩu"
        size="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            type="password"
            name="currentPassword"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            icon={Lock}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
          />
          <Input
            type="password"
            name="newPassword"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            icon={Lock}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
          />
          <Input
            type="password"
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            icon={Lock}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Xác nhận
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </LoginRequired>
  );
}
