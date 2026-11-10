import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-daylight rounded-card flex items-center justify-center text-3xl mb-6">
        404
      </div>
      <h1 className="text-3xl font-bold text-midnight mb-2">Page Not Found</h1>
      <p className="text-ink/70 mb-6 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-midnight text-daylight px-6 py-3 rounded-pill font-semibold text-sm hover:bg-midnight/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
};
