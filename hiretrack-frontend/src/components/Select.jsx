import React from 'react';

/**
 * Reusable Select dropdown component.
 */
export const Select = ({
  label,
  id,
  options = [],
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
      <select
        id={id}
        className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
          error ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 text-slate-900'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-rose-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
