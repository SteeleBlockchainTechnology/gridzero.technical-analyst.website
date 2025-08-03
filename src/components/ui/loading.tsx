import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-green-500`} />
      {text && <span className="text-gray-400 text-sm">{text}</span>}
    </div>
  );
};

// Skeleton loader for cards
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded-lg ${className}`}>
    <div className="p-4">
      <div className="h-4 bg-slate-600 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-slate-600 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-600 rounded w-2/3"></div>
    </div>
  </div>
);

// Data unavailable message
export const DataUnavailable: React.FC<{ 
  message?: string; 
  className?: string; 
}> = ({ 
  message = 'Data currently unavailable', 
  className = '' 
}) => (
  <div className={`flex items-center justify-center p-8 text-gray-400 text-center ${className}`}>
    <div>
      <div className="text-gray-500 mb-2">⚠️</div>
      <p className="text-sm">{message}</p>
    </div>
  </div>
);
