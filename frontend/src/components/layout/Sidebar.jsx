import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Receipt,
  User,
  Settings,
  Bell,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookOpen,
  GraduationCap,
  Bot,
  Trophy,
  ShoppingBag,
  CreditCard,
  LogIn,
  UserPlus,
  MessageSquare,
  PenSquare,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { path: '/forum', icon: MessageSquare, label: 'Diễn đàn' },
  { path: '/chat', icon: PenSquare, label: 'Chat' },
  { path: '/mentors', icon: GraduationCap, label: 'Mentors' },
  { path: '/ai', icon: Bot, label: 'AI Assistant' },
  { path: '/gamification', icon: Trophy, label: 'Achievements' },
];

const protectedMenuItems = [
  { path: '/transactions', icon: Receipt, label: 'Giao dịch' },
  { path: '/profile', icon: User, label: 'Hồ sơ' },
  { path: '/notifications', icon: Bell, label: 'Thông báo' },
  { path: '/settings', icon: Settings, label: 'Cài đặt' },
];

const mentorItems = [
  { path: '/mentor/courses', icon: BookOpen, label: 'Quản lý Khóa học' },
];

const adminItems = [
  { path: '/admin', icon: Users, label: 'Admin Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Quản lý Users' },
  { path: '/admin/payments', icon: CreditCard, label: 'Duyệt thanh toán' },
  { path: '/admin/settings', icon: Settings, label: 'Cài đặt hệ thống' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor' || user?.role === 'admin';

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
        hidden lg:block
      `}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            {isOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-xl gradient-text">FPTAIEZ</h1>
                <p className="text-xs text-gray-500">Learning Platform</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="mb-4">
            {isOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                Menu chính
              </p>
            )}
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <div className="mb-4">
            {isOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                Tài khoản
              </p>
            )}
            {isAuthenticated ? (
              protectedMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">Đăng nhập</span>}
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <UserPlus className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">Đăng ký</span>}
                </NavLink>
                {isOpen && (
                  <div className="mt-3 mx-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                    <p className="text-xs text-primary-700 dark:text-primary-300 text-center">
                      Đăng nhập để truy cập đầy đủ tính năng
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {isMentor && !isAdmin && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {isOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                  Mentor
                </p>
              )}
              {mentorItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {isOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                  Quản trị
                </p>
              )}
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {isOpen && <span className="text-sm">Thu gọn</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
