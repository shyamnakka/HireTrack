import React from 'react';

/**
 * Reusable LoadingSpinner component with SVG path for accessibility.
 */
export const LoadingSpinner = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      className={`flex justify-center items-center ${className}`}
      {...props}
    >
      <svg
        className={`animate-spin text-slate-200 fill-indigo-600 rounded-full ${sizes[size] || sizes.md}`}
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5918 10.497 44.065 10.0814C48.3934 9.35407 52.8482 9.29413 57.068 9.90795C62.155 10.6384 66.9749 12.3843 71.3061 15.0081C75.6373 17.632 79.4187 21.0581 82.4704 25.1091C84.7766 28.16 86.6023 31.5433 87.9334 35.1763C88.7878 37.534 91.5422 38.678 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
