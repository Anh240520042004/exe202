import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentDashboard } from '../../store/dashboardSlice';
import { BookOpen, Users, MessageCircle, Download, Star, Flame, Zap, Calendar, TrendingUp, FolderOpen, LogIn, Coins, Gift } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { student, isLoading } = useSelector(state => state.dashboard);
  const { isAuthenticated } = useSelector(state => state.auth);

  // Guest view - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="auth-page min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md auth-form-panel rounded-[1.75rem] p-8">
          <div className="auth-logo inline-flex items-center justify-center rounded-[1.75rem] mb-6 p-2.5">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">F.EdTech</h1>
          <p className="text-primary-700 dark:text-primary-200/90 mb-3 text-base leading-relaxed">
            Nền tảng học tập thông minh giúp sinh viên tìm tài liệu, kết nối mentor và học hiệu quả hơn.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Đăng nhập để truy cập dashboard và bắt đầu hành trình học tập
          </p>
          <button
            onClick={() => navigate('/login')}
            className="glass-nav-link px-8 py-4 bg-primary-400/60 text-white rounded-2xl font-bold text-lg hover:bg-primary-500/70 transition-all flex items-center gap-3 mx-auto border border-white/15"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập ngay
          </button>
          <p className="text-gray-500 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 font-semibold">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    dispatch(fetchStudentDashboard());
  }, [dispatch]);

  if (isLoading || !student) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, recentOrders, upcomingBookings, recentChats, recentDownloads, weeklyStudy, subjectProgress } = student;

  const xpForNextLevel = profile.xpForNextLevel || profile.xp + 500;

  return (
    <div className="min-h-screen">
      <div className="glass-hero glass-hero-accent mx-4 mt-2 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-6">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name || 'U')}`}
              alt={profile.name}
              className="w-20 h-20 rounded-full border-4 border-white/20 object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=8b6cf0&color=fff`;
              }}
            />
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white drop-shadow-sm">Welcome back, {profile.name}!</h1>
              <p className="text-slate-600 dark:text-gray-400 mt-1 font-medium">GPA: {profile.gpa} | Level {profile.level}</p>
            </div>
            <div className="text-center glass-chip px-6 py-4 rounded-2xl bg-white/70 dark:bg-white/5">
              <Flame className="mx-auto text-orange-400 mb-1" size={24} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{profile.studyStreak}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">day streak</p>
            </div>
            <div className="text-center glass-chip px-6 py-4 rounded-2xl bg-white/70 dark:bg-white/5">
              <Coins className="mx-auto text-amber-400 mb-1" size={24} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(profile.rewardPoints || 0)}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">reward points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <Link
            to="/my-documents"
            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <FolderOpen size={18} />
            <span>Xem tất cả tài liệu</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-blue-500" />} label="Documents" value={stats.documentsOwned} color="blue" />
          <StatCard icon={<Users className="text-purple-500" />} label="Mentor Sessions" value={stats.mentorSessions} color="purple" />
          <StatCard icon={<MessageCircle className="text-green-500" />} label="AI Chats" value={stats.aiChatsCount} color="green" />
          <StatCard icon={<Download className="text-orange-500" />} label="Downloads" value={stats.totalDownloads} color="orange" />
          <StatCard icon={<Coins className="text-amber-500" />} label="Reward Points" value={new Intl.NumberFormat('vi-VN').format(profile.rewardPoints || 0)} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-primary-500" />
                Hoạt Động Trong Tuần
              </h2>
              <span className="text-xs text-gray-400">
                {weeklyStudy?.reduce((sum, d) => sum + d.count, 0) || 0} hoạt động
              </span>
            </div>
            {weeklyStudy && weeklyStudy.length > 0 ? (
              <>
                <div className="h-48 grid grid-cols-[2rem_1fr] gap-3 mb-3">
                  <div className="flex flex-col justify-between pb-7 text-[10px] text-gray-500">
                    {(() => {
                      const maxCount = Math.max(...weeklyStudy.map(d => d.count), 1);
                      return [maxCount, Math.ceil(maxCount * 0.75), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.25), 0]
                        .filter((value, index, values) => values.indexOf(value) === index)
                        .map(value => <span key={value} className="text-right">{value}</span>);
                    })()}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map(line => (
                        <div key={line} className="border-t border-white/10" />
                      ))}
                    </div>
                    <div className="relative h-full flex items-end justify-around gap-3 pb-7">
                  {weeklyStudy.map((day, i) => {
                    const maxCount = Math.max(...weeklyStudy.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    const isToday = i === 6;
                    return (
                      <div key={i} className="h-full flex flex-col items-center justify-end gap-2 flex-1 group relative">
                        <span className="text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                          {day.count}
                        </span>
                        <div
                          className={`w-8 sm:w-10 rounded-t-xl transition-all hover:opacity-90 shadow-lg ${
                            day.count === 0
                              ? 'bg-gray-700/45 shadow-none'
                              : isToday
                              ? 'bg-gradient-to-t from-primary-700 via-primary-500 to-primary-300 shadow-primary-500/30'
                              : 'bg-gradient-to-t from-violet-700 via-violet-500 to-violet-300 shadow-violet-500/25'
                          }`}
                          style={{ height: `${day.count === 0 ? 6 : Math.max(height, 14)}%` }}
                        />
                        <span className={`text-xs font-semibold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-400" />
                    <span className="text-xs text-gray-500">Bài viết, mua tài liệu, AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-500">Không hoạt động</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">Chưa có hoạt động trong tuần này</p>
                  <p className="text-gray-300 dark:text-gray-500 text-xs mt-1">Đăng bài, mua tài liệu hoặc trò chuyện với AI để ghi nhận!</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="text-green-500" />
              Lịch Sử Tải Xuống
            </h2>
            <div className="space-y-3">
              {recentDownloads?.slice(0, 5).map((item, idx) => (
                <div key={item._id || idx} className="flex items-center gap-3 p-2 rounded-xl glass-nav-hover transition-colors">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-sm">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.document?.title || 'Tài liệu'}</p>
                    <p className="text-xs text-gray-500">{new Date(item.downloadedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
              {(!recentDownloads || recentDownloads.length === 0) && (
                <p className="text-gray-400 text-center py-4">Chưa tải tài liệu nào</p>
              )}
            </div>
            <Link
              to="/download-history"
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
            >
              <FolderOpen size={16} />
              Xem lịch sử đầy đủ
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold">Tài Liệu Đã Tải Gần Đây</h2>
              <Link to="/download-history" className="text-primary-600 text-sm hover:underline">Xem tất cả</Link>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {recentDownloads?.slice(0, 5).map((item, idx) => (
                <div key={item._id || idx} className="p-4 flex items-center gap-3">
                  <BookOpen className="text-gray-400" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.document?.title || 'Tài liệu'}</p>
                    <p className="text-xs text-gray-500">
                      {item.document?.subjectCode} - {new Date(item.downloadedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentDownloads || recentDownloads.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Chưa tải tài liệu nào</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold">Upcoming Sessions</h2>
              <Link to="/mentors" className="text-primary-600 text-sm hover:underline">View all</Link>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {upcomingBookings?.slice(0, 3).map(booking => (
                <div key={booking._id} className="p-4 flex items-center gap-3">
                  <img src={booking.mentor?.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">{booking.mentor?.name}</p>
                    <p className="text-xs text-gray-500">{booking.subject} - {new Date(booking.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-primary-600">{booking.startTime}</span>
                </div>
              ))}
              {(!upcomingBookings || upcomingBookings.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No upcoming sessions</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold">Recent AI Chats</h2>
              <Link to="/ai" className="text-primary-600 text-sm hover:underline">View all</Link>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {recentChats?.slice(0, 4).map(chat => (
                <div key={chat._id} className="p-4 flex items-center gap-3">
                  <MessageCircle className="text-purple-400" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-gray-500">{chat.subject}</p>
                  </div>
                </div>
              ))}
              {(!recentChats || recentChats.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No AI chats yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = React.memo(({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value || 0}</p>
        </div>
      </div>
    </div>
  );
});

export default StudentDashboard;
