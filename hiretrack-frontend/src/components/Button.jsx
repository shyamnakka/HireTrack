import React from 'react';

/**
 * Reusable, keyboard-accessible Button component supporting multiple variants.
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white active:bg-indigo-800',
    secondary: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 active:bg-slate-100',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white active:bg-rose-800',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
