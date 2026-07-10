import React from 'react';

/**
 * Reusable input element linked dynamically to labels for screen reader support.
 */
export const Input = ({
  label,
  id,
  type = 'text',
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
          error ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 text-slate-900'
        }`}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
