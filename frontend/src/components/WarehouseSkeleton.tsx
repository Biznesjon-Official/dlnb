import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const WarehouseSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className={`rounded-xl border-2 p-4 sm:p-6 animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className={`h-5 sm:h-6 rounded w-3/4 mb-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-3 sm:h-4 rounded w-1/2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div className={`p-2 sm:p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className={`h-3 rounded w-16 mb-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-5 rounded w-12 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className={`h-3 rounded w-16 mb-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-5 rounded w-20 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className={`h-3 rounded w-full mb-2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-3 rounded w-2/3 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-9 sm:h-10 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WarehouseSkeleton;
