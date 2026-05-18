import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  title,
  subtitle,
  headerAction,
  noPadding = false 
}) {
  return (
    <div className={`
      bg-white dark:bg-gray-800
      rounded-xl 
      shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50
      border border-gray-100 dark:border-gray-700
      overflow-hidden
      ${className}
    `}>
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? '+' : ''}{trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
