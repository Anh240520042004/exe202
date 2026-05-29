import React from 'react';

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}) {
  const variants = {
    default: 'bg-white/20 text-gray-700 dark:bg-white/8 dark:text-gray-300 backdrop-blur-md',
    primary: 'bg-primary-400/15 text-primary-600 dark:text-primary-300 backdrop-blur-md',
    success: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 backdrop-blur-md',
    danger: 'bg-rose-400/15 text-rose-700 dark:text-rose-300 backdrop-blur-md',
    warning: 'bg-amber-300/15 text-amber-700 dark:text-amber-300 backdrop-blur-md',
    info: 'bg-sky-400/15 text-sky-700 dark:text-sky-300 backdrop-blur-md',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  );
}
