import React from 'react';

/**
 * Reusable EmptyState component with centered vector layout and message options.
 */
export const EmptyState = ({
  title = 'No items found',
  description = 'Get started by creating a new entry.',
  actionButton,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 ${className}`}
      {...props}
    >
      <svg
        className="w-12 h-12 text-slate-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
