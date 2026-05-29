import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, Bell, Search, LogOut, UserPlus, LogIn } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { toggleMobileMenu } from '../../store/slices/uiSlice';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 glass-header border-b glass-divider">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="glass-nav-link lg:hidden p-2 rounded-ios glass-nav-hover"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 glass-search">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm w-64 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="glass-nav-link relative p-2 rounded-ios glass-nav-hover transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-3 pl-2 border-l glass-divider">
                <Link to="/profile" className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt={user?.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-primary-300/50 dark:border-primary-600/50"
                  />
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-ios hover:bg-red-500/15 text-gray-500 hover:text-red-500 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l glass-divider">
              <Link
                to="/login"
                className="glass-nav-link flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 glass-nav-hover rounded-ios transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="glass-nav-link flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-400/55 backdrop-blur-md text-white rounded-ios hover:bg-primary-500/65 transition-colors border border-white/25"
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
