import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentDashboard } from '../../store/dashboardSlice';
import { BookOpen, Users, MessageCircle, Download, Star, Flame, Zap, Calendar, TrendingUp, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { student, isLoading } = useSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchStudentDashboard());
  }, [dispatch]);

  if (isLoading || !student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, recentOrders, upcomingBookings, recentChats, recentDownloads, weeklyStudy, subjectProgress } = student;

  const xpForNextLevel = profile.xpForNextLevel || profile.xp + 500;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <img src={profile.avatar} alt={profile.name} className="w-20 h-20 rounded-full border-4 border-white/30" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Welcome back, {profile.name}!</h1>
              <p className="text-primary-100">GPA: {profile.gpa} | Level {profile.level}</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-6 py-4">
              <Flame className="mx-auto text-orange-400 mb-1" size={24} />
              <p className="text-2xl font-bold">{profile.studyStreak}</p>
              <p className="text-xs text-primary-200">day streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Quick Access</h2>
          <Link
            to="/my-documents"
            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <FolderOpen size={18} />
            <span>Xem tất cả tài liệu</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<BookOpen className="text-blue-500" />} label="Documents" value={stats.documentsOwned} color="blue" />
          <StatCard icon={<Users className="text-purple-500" />} label="Mentor Sessions" value={stats.mentorSessions} color="purple" />
          <StatCard icon={<MessageCircle className="text-green-500" />} label="AI Chats" value={stats.aiChatsCount} color="green" />
          <StatCard icon={<Download className="text-orange-500" />} label="Downloads" value={stats.totalDownloads} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary-500" />
              Hoạt Động Trong Tuần
            </h2>
            <div className="h-48 flex items-end justify-around gap-4">
              {weeklyStudy?.map((day, i) => {
                const maxCount = Math.max(...(weeklyStudy.map(d => d.count) || [1]));
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:opacity-80 min-h-[4px]"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                );
              })}
              {(!weeklyStudy || weeklyStudy.length === 0) && (
                <div className="text-gray-400 text-center py-8 w-full">Chưa có dữ liệu hoạt động</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="text-green-500" />
              Lịch Sử Tải Xuống
            </h2>
            <div className="space-y-3">
              {recentDownloads?.slice(0, 5).map((item, idx) => (
                <div key={item._id || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-sm">
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
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
            >
              <FolderOpen size={16} />
              Xem lịch sử đầy đủ
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
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

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
