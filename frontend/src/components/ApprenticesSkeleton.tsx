import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const ApprenticesSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`group relative rounded-xl border-2 transition-all duration-300 animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}
        >
          {/* Card Header with Gradient Skeleton */}
          <div className={`h-16 sm:h-20 relative rounded-t-xl ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div className="absolute -bottom-6 sm:-bottom-8 left-4 sm:left-5">
              <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl shadow-lg border-4 ${
                isDarkMode ? 'bg-gray-600 border-gray-800' : 'bg-gray-300 border-white'
              }`}></div>
            </div>
          </div>

          {/* Card Content Skeleton */}
          <div className="pt-8 sm:pt-10 px-4 sm:px-5 pb-4 sm:pb-5">
            {/* Name and Username Skeleton */}
            <div className="mb-3">
              <div className={`h-5 sm:h-6 rounded w-3/4 mb-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-3 sm:h-4 rounded w-1/2 mb-1 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-3 rounded w-2/3 mt-1 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>

            {/* Contact Info Skeleton */}
            <div className={`space-y-2 mb-3 pb-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div className="flex items-center">
                <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded mr-2 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-3 sm:h-4 rounded flex-1 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
              <div className="flex items-center">
                <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded mr-2 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-3 sm:h-4 rounded w-1/3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>

            {/* Performance Stats Skeleton */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-3 sm:h-4 rounded w-1/3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-5 sm:h-6 rounded w-12 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
              <div className={`w-full rounded-full h-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>

            {/* Task Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className={`text-center p-2 sm:p-2.5 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-4 sm:h-5 rounded w-8 mx-auto mb-1 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-3 rounded w-12 mx-auto ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              ))}
            </div>

            {/* Earnings Display Skeleton */}
            <div className={`mb-4 p-2.5 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className="flex-1 space-y-1">
                  <div className={`h-3 rounded w-1/3 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-4 sm:h-5 rounded w-2/3 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-9 sm:h-10 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-9 sm:h-10 w-9 sm:w-10 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-9 sm:h-10 w-9 sm:w-10 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>

          {/* Status Badge Skeleton */}
          <div className="absolute top-16 sm:top-24 right-3 sm:right-4">
            <div className={`h-6 w-16 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprenticesSkeleton;
