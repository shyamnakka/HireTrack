import React from 'react';

/**
 * Reusable layout Card panel.
 */
export const Card = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
