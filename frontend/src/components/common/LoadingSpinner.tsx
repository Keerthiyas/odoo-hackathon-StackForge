import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-500 py-6 ${className}`}>
      <Loader2 className={`${sizeClasses} animate-spin text-blue-600`} />
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
};
