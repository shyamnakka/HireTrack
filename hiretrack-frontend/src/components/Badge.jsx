import React from 'react';

/**
 * Reusable status Badge tag utilizing semantic colors.
 */
export const Badge = ({
  children,
  color = 'neutral',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border';

  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`${baseStyle} ${colors[color] || colors.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
