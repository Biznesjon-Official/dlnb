import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const CarsSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`rounded-xl sm:rounded-2xl shadow-lg border p-4 sm:p-6 animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}
        >
          {/* Card Layout - Vertikal */}
          <div className="space-y-4">
            {/* Header - Avatar va Title */}
            <div className="flex items-start gap-3">
              {/* Avatar/Icon */}
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>

              {/* Title va Subtitle */}
              <div className="flex-1 space-y-2">
                <div
                  className={`h-5 rounded-lg w-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                ></div>
                <div
                  className={`h-4 rounded-lg w-3/4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                ></div>
              </div>
            </div>

            {/* Details Badges */}
            <div className="flex flex-wrap gap-2">
              <div
                className={`h-6 rounded-full w-20 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`h-6 rounded-full w-24 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`h-6 rounded-full w-16 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
            </div>

            {/* Divider */}
            <div
              className={`h-px w-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            ></div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div
                  className={`h-3 rounded w-16 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                ></div>
                <div
                  className={`h-3 rounded w-20 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                ></div>
              </div>
              <div
                className={`h-2 rounded-full w-full ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <div
                className={`h-9 flex-1 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`h-9 w-9 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`h-9 w-9 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`h-9 w-9 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarsSkeleton;
