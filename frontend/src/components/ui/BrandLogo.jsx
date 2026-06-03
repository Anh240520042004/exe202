import React from 'react';
import brandMark from '../../assets/Screenshot 2026-06-02 153749.png';

const sizeClasses = {
  sm: 'w-9 h-9 p-1',
  md: 'w-10 h-10 p-1',
  lg: 'w-16 h-16 p-1.5',
};

const titleClasses = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

const taglineClasses = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export default function BrandLogo({
  showText = false,
  size = 'md',
  className = '',
  title = 'F.EdTech',
  tagline = 'Nền tảng học tập',
}) {
  const safeSize = sizeClasses[size] ? size : 'md';

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div
        className={`
          ${sizeClasses[safeSize]}
          rounded-[1.25rem] bg-white/88 border border-white/70
          dark:bg-white/84 dark:border-white/10
          shadow-md shadow-primary-500/15 overflow-hidden
          flex items-center justify-center
        `}
      >
        <img
          src={brandMark}
          alt={title}
          className="w-full h-full object-contain mix-blend-multiply select-none"
          draggable="false"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <h1 className={`font-bold text-gray-900 dark:text-white ${titleClasses[safeSize]}`}>
            {title}
          </h1>
          <p className={`${taglineClasses[safeSize]} text-gray-500 dark:text-gray-400`}>
            {tagline}
          </p>
        </div>
      )}
    </div>
  );
}
