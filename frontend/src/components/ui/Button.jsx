import React from 'react';

const variants = {
  primary: 'bg-gradient-to-r from-primary-400/75 to-primary-500/75 hover:from-primary-500/85 hover:to-primary-600/85 text-white shadow-md shadow-primary-400/15 backdrop-blur-md border border-white/25',
  secondary: 'glass-subtle hover:opacity-95 text-gray-700 dark:text-gray-200',
  success: 'bg-gradient-to-r from-emerald-400/70 to-teal-400/70 hover:from-emerald-500/80 hover:to-teal-500/80 text-white shadow-md shadow-emerald-400/15 backdrop-blur-md border border-white/25',
  danger: 'bg-gradient-to-r from-rose-400/70 to-pink-400/70 hover:from-rose-500/80 hover:to-pink-500/80 text-white shadow-md shadow-rose-400/15 backdrop-blur-md border border-white/25',
  outline: 'glass-subtle border border-primary-400/35 text-primary-500 dark:text-primary-300 hover:bg-primary-400/8',
  ghost: 'hover:bg-white/15 dark:hover:bg-white/8 text-gray-600 dark:text-gray-300 backdrop-blur-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-ios
        transition-all duration-200 ease-in-out
        transform hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
