import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BrandLogo } from '../ui';
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
  ShieldOff,
  PenSquare,
  FileText,
  Crown,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { path: '/forum', icon: MessageSquare, label: 'Diễn đàn' },
  { path: '/chat', icon: PenSquare, label: 'Chat' },
  { path: '/mentors', icon: GraduationCap, label: 'Mentors' },
  { path: '/ai', icon: Bot, label: 'AI Chatbot GPT' },
  { path: '/gamification', icon: Trophy, label: 'Achievements' },
];

const protectedMenuItems = [
  { path: '/transactions', icon: Receipt, label: 'Giao dịch' },
  { path: '/profile', icon: User, label: 'Hồ sơ' },
  { path: '/notifications', icon: Bell, label: 'Thông báo' },
  { path: '/settings', icon: Settings, label: 'Cài đặt' },
];

const mentorItems = [
  { path: '/mentor/documents', icon: BookOpen, label: 'Tài liệu cá nhân' },
];

const adminItems = [
  { path: '/admin', icon: Users, label: 'Admin Dashboard' },
  { path: '/admin/documents', icon: FileText, label: 'Tài liệu Marketplace' },
  { path: '/admin/forum-posts', icon: ShieldOff, label: 'Quản lý bài diễn đàn' },
  { path: '/admin/payments', icon: CreditCard, label: 'Duyệt thanh toán' },
];

const navLinkClass = (isActive) => `
  glass-nav-link flex items-center gap-3 px-3 py-2.5 rounded-ios
  ${isActive
    ? 'glass-nav-active text-primary-600 dark:text-primary-400'
    : 'text-gray-600 dark:text-gray-400 glass-nav-hover'
  }
`;

export default function Sidebar({ isOpen, onToggle }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor' || user?.role === 'admin';

  const displayMenuItems = menuItems.map((item) => {
    if (item.path === '/gamification' && isAdmin) {
      return { path: '/admin/mentor-suggestions', icon: Crown, label: 'Mentor đề xuất' };
    }
    return item;
  });

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen
        glass-sidebar
        glass-divider border-r
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
        hidden lg:block
      `}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b glass-divider">
          <BrandLogo showText={isOpen} className={isOpen ? 'animate-fade-in' : ''} />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          <div className="mb-4">
            {isOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                Menu chính
              </p>
            )}
            {displayMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => navLinkClass(isActive)}
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
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">Đăng nhập</span>}
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <UserPlus className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">Đăng ký</span>}
                </NavLink>
                {isOpen && (
                  <div className="mt-3 mx-3 p-3 glass-subtle rounded-ios">
                    <p className="text-xs text-primary-700 dark:text-primary-300 text-center">
                      Đăng nhập để truy cập đầy đủ tính năng
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {isMentor && !isAdmin && (
            <div className="pt-4 border-t glass-divider">
              {isOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                  Mentor
                </p>
              )}
              {mentorItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 border-t glass-divider">
              {isOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                  Quản trị
                </p>
              )}
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t glass-divider">
          <button
            onClick={onToggle}
            className="glass-nav-link w-full flex items-center justify-center gap-2 px-3 py-2 rounded-ios text-gray-500 glass-nav-hover transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {isOpen && <span className="text-sm">Thu gọn</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
