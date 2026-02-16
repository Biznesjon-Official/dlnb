import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const BookingsSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className={`group relative rounded-xl shadow-sm border-2 transition-all duration-200 flex flex-col animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Card Content */}
          <div className="p-4 flex flex-col h-full">
            {/* Content wrapper */}
            <div className="flex-1 flex flex-col">
              {/* Header Skeleton */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className={`h-5 rounded w-3/4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 rounded w-24 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Info Grid Skeleton */}
              <div className="space-y-2 mt-3">
                {/* License Plate Skeleton */}
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className={`h-4 w-4 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-3 rounded flex-1 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>

                {/* Booking Date Skeleton */}
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className={`h-4 w-4 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-3 rounded flex-1 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>

                {/* Birth Date Skeleton */}
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex-1 space-y-1">
                    <div className={`h-3 rounded w-2/3 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div className={`flex-1 h-9 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
              <div className={`flex-1 h-9 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingsSkeleton;
