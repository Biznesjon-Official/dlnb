const CustomersSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-rose-200'
          } animate-pulse`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Avatar skeleton */}
              <div
                className={`w-12 h-12 rounded-full ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div className="flex-1 space-y-2">
                {/* Name skeleton */}
                <div
                  className={`h-4 rounded w-32 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
                {/* Phone skeleton */}
                <div
                  className={`h-3 rounded w-24 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
              </div>
            </div>
            <div className="text-right space-y-2">
              {/* Stats skeleton */}
              <div
                className={`h-4 rounded w-20 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-3 rounded w-16 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomersSkeleton;
