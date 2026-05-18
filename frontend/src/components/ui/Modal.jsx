import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true 
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
          transform transition-all
          ${sizeClasses[size]}
        `}>
          {(title || showClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
