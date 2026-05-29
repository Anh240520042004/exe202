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
      glass-card
      overflow-hidden
      ${className}
    `}>
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b glass-divider flex items-center justify-between">
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
    primary: 'bg-primary-400/12 text-primary-500 dark:text-primary-300',
    success: 'bg-emerald-400/12 text-emerald-600 dark:text-emerald-300',
    danger: 'bg-rose-400/12 text-rose-600 dark:text-rose-300',
    warning: 'bg-amber-300/12 text-amber-600 dark:text-amber-300',
    info: 'bg-sky-400/12 text-sky-600 dark:text-sky-300',
  };

  return (
    <div className="glass-card p-6">
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
          <div className={`p-3 rounded-ios backdrop-blur-sm ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
