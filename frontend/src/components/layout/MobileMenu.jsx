import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, LayoutDashboard, Receipt, User, Bell, LogOut } from 'lucide-react';
import { setMobileMenuOpen } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'Giao dịch' },
  { path: '/profile', icon: User, label: 'Hồ sơ' },
  { path: '/notifications', icon: Bell, label: 'Thông báo' },
];

export default function MobileMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobileMenuOpen } = useSelector((state) => state.ui);
  const user = useSelector((state) => state.auth.user);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const handleClose = () => dispatch(setMobileMenuOpen(false));

  const handleLogout = async () => {
    await dispatch(logout());
    handleClose();
    navigate('/login');
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleClose}
        />
      )}
      
      <div className={`
        fixed top-0 left-0 z-50 w-72 h-full
        bg-white dark:bg-gray-900
        transform transition-transform duration-300
        lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">FPTAIEZ</h1>
            </div>
          </div>
          <button onClick={handleClose} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-colors
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
}
