import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const CashierSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'
    }`}>
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-pulse">
        {/* Header Section Skeleton */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100/50'
        }`}>
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            {/* Header Title and Buttons Skeleton */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Icon Skeleton */}
                <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div>
                  {/* Title Skeleton */}
                  <div className={`h-8 sm:h-10 lg:h-12 rounded-lg w-32 sm:w-40 mb-2 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  {/* Subtitle Skeleton */}
                  <div className={`h-4 sm:h-5 rounded w-48 sm:w-64 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
              
              {/* Action Buttons Skeleton */}
              <div className="grid grid-cols-2 gap-2 w-full lg:grid-cols-3 lg:w-auto lg:ml-auto">
                <div className={`h-10 sm:h-11 rounded-lg sm:rounded-xl w-24 sm:w-28 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-10 sm:h-11 rounded-lg sm:rounded-xl w-28 sm:w-32 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-10 sm:h-11 rounded-lg sm:rounded-xl w-20 sm:w-24 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
            {/* Mobile Action Buttons Skeleton (lg:hidden) */}
            <div className="grid grid-cols-2 gap-3 mb-5 lg:hidden">
              <div className={`h-12 rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-12 rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* KIRIM Card Skeleton */}
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`relative overflow-hidden rounded-xl p-4 border ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                  }`}
                >
                  {/* Icon and Badge Skeleton */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-6 w-16 rounded-full ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  
                  {/* Total Amount Skeleton */}
                  <div className="mb-3">
                    <div className={`h-3 rounded w-16 mb-1 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-8 rounded w-32 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  
                  {/* Cash and Card Skeleton */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`rounded-lg p-2 ${
                      isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                    }`}>
                      <div className={`h-3 rounded w-12 mb-1 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-4 rounded w-20 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </div>
                    
                    <div className={`rounded-lg p-2 ${
                      isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                    }`}>
                      <div className={`h-3 rounded w-12 mb-1 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-4 rounded w-20 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                  
                  {/* Count Skeleton */}
                  <div className={`h-3 rounded w-16 pt-2 border-t ${
                    isDarkMode ? 'bg-gray-700 border-gray-700' : 'bg-gray-200 border-gray-200'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Action Buttons Skeleton (hidden lg:block) */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10 hidden lg:block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`h-24 rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-24 rounded-xl ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border p-5 sm:p-7 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100/50'
        }`}>
          <div className="relative z-10">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-6 sm:h-8 rounded w-48 sm:w-64 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
              
              {/* Filters Skeleton */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <div className={`h-10 rounded-xl w-full sm:w-64 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-10 rounded-xl w-full sm:w-32 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>

            {/* Transactions List Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i}
                  className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border-2 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gradient-to-r from-gray-800/20 to-transparent'
                      : 'border-gray-200 bg-gradient-to-r from-gray-50 to-transparent'
                  }`}
                >
                  {/* Decorative Border Skeleton */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon Skeleton */}
                      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex-shrink-0 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title and Badge Skeleton */}
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-4 sm:h-5 rounded w-24 ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                          <div className={`h-5 w-14 rounded-full ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                        </div>
                        
                        {/* Description Skeleton */}
                        <div className={`h-3 rounded w-full mb-2 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                        
                        {/* Meta Info Skeleton */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`h-5 w-20 rounded ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                          <div className={`h-5 w-16 rounded ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                          <div className={`h-5 w-24 rounded ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount Skeleton */}
                    <div className={`h-5 sm:h-6 rounded w-20 flex-shrink-0 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierSkeleton;
