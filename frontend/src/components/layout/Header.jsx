import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, Bell, Search, LogOut, UserPlus, LogIn, Home, HeartHandshake, Building2, Facebook } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { toggleMobileMenu } from '../../store/slices/uiSlice';
import { ThemeToggle } from '../ui';

const LINKS = {
  support: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
  fptUniversity: 'https://www.facebook.com/DaihocFPTHaNoi',
  fanpage: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
};

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

        {/* Center: Social links and Home button */}
        <div className="hidden lg:flex items-center gap-3 mx-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-violet-200 dark:border-violet-800"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <a
            href={LINKS.support}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Hỗ Trợ</span>
          </a>
          <a
            href={LINKS.fptUniversity}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 rounded-lg transition-all duration-200 border border-green-200 dark:border-green-800"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ĐH FPT</span>
          </a>
          <a
            href={LINKS.fanpage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg transition-all duration-200 border border-indigo-200 dark:border-indigo-800"
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Trang Của Chúng Tôi</span>
          </a>
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
                <Link to={user?._id || user?.id ? `/profile/${user?._id || user?.id}` : '/profile'} className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt={user?.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-primary-300/60 dark:border-primary-600/50"
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
                className="glass-nav-link flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-ios hover:opacity-90 transition-all shadow-sm shadow-primary-500/25"
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
