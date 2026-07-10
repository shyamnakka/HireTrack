import React from 'react';

/**
 * Reusable PageHeader component showing title and action buttons.
 */
export const PageHeader = ({
  title,
  subtitle,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-6 border-b border-slate-200 ${className}`}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 space-x-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
