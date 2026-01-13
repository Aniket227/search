import React from "react";

type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
}

const LoadingSpinner = React.memo(({ size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses: Record<LoadingSpinnerSize, string> = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-t-blue-500 border-gray-200`}
      />
    </div>
  );
});

export default LoadingSpinner;
