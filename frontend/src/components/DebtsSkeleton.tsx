import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const DebtsSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`rounded-xl shadow-lg border-2 transition-all duration-300 animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}
        >
          {/* Card Header Skeleton */}
          <div className={`p-4 sm:p-5 ${
            isDarkMode
              ? 'bg-gray-800 border-b border-gray-700'
              : 'bg-gray-50 border-b border-gray-100'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div className="h-5 w-5 bg-gray-600 rounded"></div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className={`h-5 w-3/4 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-3 w-1/2 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className="h-3 w-12 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>

          {/* Card Body Skeleton */}
          <div className="p-4 sm:p-5 space-y-3">
            {/* Amount Info */}
            <div className={`rounded-lg p-3 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className={`h-3 w-20 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 w-24 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                ))}
                {/* Progress Bar */}
                <div className={`pt-2 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className={`w-full h-2 rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <div className={`h-3 w-full rounded ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
              <div className={`h-3 w-3/4 rounded ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
            </div>
          </div>

          {/* Card Footer Skeleton */}
          <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-9 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
              <div className={`h-9 w-9 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
              <div className={`h-9 w-9 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DebtsSkeleton;
