import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-2xl font-bold text-slate-800">Page not found</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Sorry, we couldn't find the page you are looking for. It might have been moved or deleted.
        </p>
        <div>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
