import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, ThemeToggle } from '../ui';
import { Home, HeartHandshake, Building2, Facebook } from 'lucide-react';

const LINKS = {
  support: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
  fptUniversity: 'https://www.facebook.com/DaihocFPTHaNoi',
  fanpage: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
};

export default function AuthLayout({ title, subtitle, children, footer, footerLink }) {
  return (
    <div className="auth-page min-h-screen flex flex-col justify-between ios-bg">
      {/* Top Header */}
      <header className="sticky top-0 z-30 glass-header border-b glass-divider bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Left: Brand logo */}
          <BrandLogo showText={true} size="md" />

          {/* Center: Social links and Home button */}
          <div className="hidden lg:flex items-center gap-3">
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

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>

          <div className="auth-form-panel rounded-[1.75rem] p-7 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border border-violet-100 dark:border-violet-900/50">
            {children}
          </div>

          {footer && footerLink && (
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
              {footer}{' '}
              <Link to={footerLink.to} className="text-primary-600 dark:text-primary-300 font-semibold hover:text-primary-500 dark:hover:text-primary-200 transition-colors">
                {footerLink.label}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t glass-divider text-center text-gray-500 dark:text-gray-500 text-xs">
        F.EdTech — Nền tảng học tập thông minh
      </footer>
    </div>
  );
}
