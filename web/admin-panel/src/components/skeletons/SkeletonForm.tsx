import React from 'react';

interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({ 
  fields = 5,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-4 pt-4">
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
