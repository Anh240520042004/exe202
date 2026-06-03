import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  containerClassName = '',
  variant = 'default',
  icon: Icon,
  ...props
}, ref) => {
  const inputClass = variant === 'auth'
    ? 'glass-input-auth'
    : 'glass-input';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${
          variant === 'auth'
            ? 'text-gray-700 dark:text-gray-300'
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${variant === 'auth' ? 'text-gray-500 dark:text-white/60' : 'text-gray-400'}`} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-4 py-2.5
            ${Icon ? 'pl-10' : ''}
            ${inputClass}
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className={`mt-1.5 text-sm ${variant === 'auth' ? 'text-red-200' : 'text-red-500'}`}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
