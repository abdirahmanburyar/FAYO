import React from 'react';

interface SkeletonShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
};

// Add shimmer animation to global CSS
export const shimmerStyles = `
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;
