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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
                <Link to="/profile" className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt={user?.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
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
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
