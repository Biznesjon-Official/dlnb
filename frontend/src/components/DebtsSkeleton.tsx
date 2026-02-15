import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const DebtsSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`rounded-lg sm:rounded-2xl shadow-lg overflow-hidden border animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}
        >
          {/* Card Header Skeleton */}
          <div className={`p-3 sm:p-6 pb-4 sm:pb-8 ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
              : 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                  <div className="h-5 w-5 sm:h-7 sm:w-7 bg-white/30 rounded"></div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 sm:h-6 w-24 sm:w-32 bg-white/30 rounded"></div>
                  <div className="h-3 sm:h-4 w-16 sm:w-20 bg-white/20 rounded"></div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-xl px-2 sm:px-3 py-1 rounded-full">
                <div className="h-3 w-12 bg-white/30 rounded"></div>
              </div>
            </div>
          </div>

          {/* Card Body Skeleton */}
          <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
            <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
              isDarkMode
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-red-900/30'
                : 'bg-gradient-to-r from-gray-50 to-blue-50/50 border-gray-100'
            }`}>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className={`h-3 w-16 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 w-20 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                ))}
                <div className={`pt-2 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className={`w-full h-2 rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className={`h-4 w-full rounded ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}></div>
              ))}
            </div>
          </div>

          {/* Card Footer Skeleton */}
          <div className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className={`flex items-stretch gap-2 pt-2 sm:pt-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div className={`flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl ${
                isDarkMode ? 'bg-red-900/30' : 'bg-orange-50'
              }`}></div>
              <div className={`h-9 sm:h-10 w-9 sm:w-10 rounded-lg sm:rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}></div>
              <div className={`h-9 sm:h-10 w-9 sm:w-10 rounded-lg sm:rounded-xl ${
                isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
              }`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DebtsSkeleton;
