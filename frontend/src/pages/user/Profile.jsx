import React, { useEffect, useState } from 'react';
import FollowListModal from '../../components/user/FollowListModal';
import MentorProfileEditor from '../../components/user/MentorProfileEditor';
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
  return type === 'income' ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [followModalType, setFollowModalType] = useState(null);

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
        {/* Beautiful Glass Profile Header Banner */}
        <div className="glass-card overflow-hidden">
          <div className="bg-gradient-to-br from-primary-500/15 via-primary-500/5 to-transparent p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <img
                src={profileData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name}`}
                alt={profileData.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/80 dark:border-white/10 shadow-xl"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profile?.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{profile?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3.5 py-1 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  {profile?.role === 'admin' ? 'Quản trị viên' : profile?.role === 'mentor' ? 'Mentor' : 'Sinh viên'}
                </span>
                <span className="px-3.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                  Tham gia: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Card title="Kết nối">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFollowModalType('followers')}
              className="bg-white/40 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl p-4 text-center hover:shadow-sm transition-all"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.stats?.followerCount ?? 0}</p>
              <p className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">Followers</p>
            </button>
            <button
              type="button"
              onClick={() => setFollowModalType('following')}
              className="bg-white/40 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl p-4 text-center hover:shadow-sm transition-all"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.stats?.followeeCount ?? 0}</p>
              <p className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">Following</p>
            </button>
          </div>
        </Card>

        {/* Structured Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Form & Transactions (Left column - takes 2/3 space) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details Form */}
            <Card title="Thông tin cá nhân">
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-5">
                  <Input
                    label="Họ tên"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    icon={User}
                  />

                  <Input
                    label="Avatar URL (Địa chỉ ảnh)"
                    name="avatar"
                    value={profileData.avatar}
                    onChange={handleProfileChange}
                    placeholder="Nhập đường dẫn ảnh liên kết..."
                  />

                  <Input
                    label="Địa chỉ Email"
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
                    className="gap-2 font-semibold"
                  >
                    <Lock className="w-4 h-4" />
                    Đổi mật khẩu
                  </Button>
                  <Button type="submit" className="gap-2 font-semibold" isLoading={isLoading}>
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </Card>

            {profile?.role === 'mentor' && (
              <MentorProfileEditor user={profile} onSaved={() => dispatch(fetchProfile())} />
            )}

            {/* Transaction History Section */}
            <Card title="Lịch sử giao dịch">
              {!showTransactionHistory ? (
                <div className="text-center py-6">
                  <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 opacity-60" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm max-w-sm mx-auto">
                    Xem lịch sử các giao dịch mua bán tài liệu và dịch vụ đã thực hiện
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowTransactionHistory(true)}
                    className="gap-2 font-semibold"
                  >
                    <Receipt className="w-4 h-4" />
                    Xem lịch sử giao dịch
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tải lịch sử giao dịch...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Summary Panel */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50/70 dark:bg-green-950/20 border border-green-100 dark:border-green-900/20 rounded-2xl p-4 text-center">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(transactionStats.totalIncome)}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Tổng thu</p>
                    </div>
                    <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-2xl p-4 text-center">
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(transactionStats.totalExpense)}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Tổng chi</p>
                    </div>
                    <div className="bg-primary-50/70 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/20 rounded-2xl p-4 text-center">
                      <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400 mx-auto mb-1.5" />
                      <p className={`text-lg font-bold ${transactionStats.balance >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-550'}`}>
                        {formatCurrency(transactionStats.balance)}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Số dư</p>
                    </div>
                  </div>

                  {/* Transaction List */}
                  {transactions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                      {transactions.map((txn) => {
                        const TxnIcon = getTransactionIcon(txn.type);
                        const colorClass = getTransactionColor(txn.type);
                        return (
                          <div key={txn._id} className="flex items-center gap-3 p-3.5 bg-white/50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-xl hover:shadow-sm transition-all">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} flex-shrink-0`}>
                              <TxnIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {txn.description || getCategoryLabel(txn.category)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{getRelativeTime(txn.date)}</span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded font-medium text-[10px]">
                                  {getCategoryLabel(txn.category)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${txn.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                              </p>
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded ${
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
                      <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Chưa thực hiện giao dịch nào
                      </p>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTransactionHistory(false)}
                      className="font-semibold"
                    >
                      Đóng lịch sử giao dịch
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Activities list (Right column - takes 1/3 space) */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Hoạt động gần đây">
              {activities.length > 0 ? (
                <div className="space-y-3.5">
                  {activities.slice(0, 10).map((activity, index) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || User;
                    const label = ACTIVITY_LABELS[activity.type] || activity.description || 'Hoạt động';
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{label}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{getRelativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
                  Chưa ghi nhận hoạt động nào
                </p>
              )}
            </Card>
          </div>
        </div>

        <FollowListModal
          isOpen={Boolean(followModalType)}
          onClose={() => setFollowModalType(null)}
          userId={profile?._id}
          type={followModalType || 'followers'}
          currentUserId={profile?._id}
        />

        {/* Change Password Modal */}
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
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
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
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t glass-divider border">
              <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)} className="font-semibold">
                Hủy
              </Button>
              <Button type="submit" className="font-semibold" isLoading={isLoading}>
                Xác nhận đổi mật khẩu
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </LoginRequired>
  );
}
