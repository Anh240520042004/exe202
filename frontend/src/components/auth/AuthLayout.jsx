import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footer, footerLink }) {
  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="auth-logo inline-flex items-center justify-center w-[72px] h-[72px] rounded-[1.75rem] mb-5">
            <span className="text-2xl font-bold text-white">F.</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">F.EdTech</h1>
          <p className="text-gray-400 text-base">{subtitle}</p>
        </div>

        <div className="auth-form-panel rounded-[1.75rem] p-7 sm:p-8">
          {title && (
            <h2 className="text-lg font-semibold text-white mb-6 text-center">{title}</h2>
          )}
          {children}
        </div>

        {footer && footerLink && (
          <p className="text-center text-gray-400 text-sm mt-6">
            {footer}{' '}
            <Link to={footerLink.to} className="text-primary-300 font-semibold hover:text-primary-200 transition-colors">
              {footerLink.label}
            </Link>
          </p>
        )}

        <p className="text-center text-gray-500 text-xs mt-8">
          F.EdTech — Nền tảng học tập thông minh
        </p>
      </div>
    </div>
  );
}
