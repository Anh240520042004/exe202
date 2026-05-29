import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LogIn, UserPlus, Shield } from 'lucide-react';

export default function LoginRequired({ children, title = 'Tính năng này', message = 'Bạn cần đăng nhập để sử dụng tính năng này' }) {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full glass-card rounded-ios-lg p-8">
        <div className="w-20 h-20 bg-primary-500/15 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <Shield className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 bg-primary-400/65 backdrop-blur-sm text-white rounded-ios font-medium hover:bg-primary-500/75 flex items-center gap-2 transition-colors border border-white/20"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 glass-subtle rounded-ios font-medium text-gray-700 dark:text-gray-300 glass-nav-hover transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Đăng ký
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Đăng ký nhanh chóng, không cần xác thực email
        </p>
      </div>
    </div>
  );
}
