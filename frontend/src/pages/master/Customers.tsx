import { useState, useMemo } from 'react';
import { Users, Search, TrendingUp, TrendingDown, Car as CarIcon } from 'lucide-react';
import { useCustomers, useCustomersStats } from '../../hooks/useCustomers';
import CustomersSkeleton from '../../components/CustomersSkeleton';
import { Customer } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const Customers = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'cars'>('all');

  const { data: customers = [], isLoading } = useCustomers();
  const { data: stats } = useCustomersStats();

  // Filter va search
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by type
    if (filterType === 'debt') {
      filtered = filtered.filter((c) => c.totalDebt > 0);
    } else if (filterType === 'cars') {
      filtered = filtered.filter((c) => c.carsCount > 0);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [customers, filterType, searchQuery]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-3 rounded-xl ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                : 'bg-gradient-to-br from-rose-500 to-pink-600'
            }`}
          >
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Mijozlar
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Barcha mijozlar ro'yxati
            </p>
          </div>
        </div>
      </div>

      {/* Statistika */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users
                className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Jami mijozlar
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {stats.totalCustomers}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown
                className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Qarzlar
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {stats.customersWithDebt}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <CarIcon
                className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Mashinalar
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {stats.customersWithCars}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp
                className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Jami qarz
              </span>
            </div>
            <p
              className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {stats.totalDebt.toLocaleString()} so'm
            </p>
          </div>
        </div>
      )}

      {/* Search va Filter */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
              isDarkMode
                ? 'bg-gray-800 border-red-900/30 text-white placeholder-gray-400'
                : 'bg-white border-rose-200 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 ${
              isDarkMode ? 'focus:ring-red-500' : 'focus:ring-rose-500'
            }`}
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : isDarkMode
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hammasi ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('debt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'debt'
                ? isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : isDarkMode
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Qarzlar ({customers.filter((c) => c.totalDebt > 0).length})
          </button>
          <button
            onClick={() => setFilterType('cars')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'cars'
                ? isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : isDarkMode
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mashinalar ({customers.filter((c) => c.carsCount > 0).length})
          </button>
        </div>
      </div>

      {/* Mijozlar ro'yxati */}
      {isLoading ? (
        <CustomersSkeleton isDarkMode={isDarkMode} />
      ) : filteredCustomers.length === 0 ? (
        <div
          className={`text-center py-12 rounded-xl border ${
            isDarkMode
              ? 'bg-gray-800/50 border-red-900/30 text-gray-400'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Mijozlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Customer Card Component
const CustomerCard = ({
  customer,
  isDarkMode,
}: {
  customer: Customer;
  isDarkMode: boolean;
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700/50'
          : 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-lg'
      }`}
    >
      {/* Header - Mijoz ma'lumotlari */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-600 to-gray-900 text-white'
                : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
            }`}
          >
            {customer.name.charAt(0).toUpperCase()}
          </div>

          {/* Ism va telefon */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-base truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {customer.name}
            </h3>
            <p
              className={`text-sm truncate ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {customer.phone}
            </p>
          </div>
        </div>

        {/* Qarz va sana */}
        <div className="text-right flex-shrink-0 ml-3">
          {customer.totalDebt > 0 && (
            <div
              className={`text-sm font-bold mb-1 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}
            >
              {customer.totalDebt.toLocaleString()} so'm
            </div>
          )}
          <p
            className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {new Date(customer.lastVisit).toLocaleDateString('uz-UZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Mashinalar ro'yxati - Ixcham */}
      {customer.cars && customer.cars.length > 0 && (
        <div className={`pt-3 border-t space-y-1.5 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          {customer.cars.slice(0, 3).map((car: any, index: number) => (
            <div
              key={index}
              className={`flex items-center justify-between text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {/* Davlat raqami */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <CarIcon className="w-3.5 h-3.5" />
                <span className={`font-bold ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {car.licensePlate}
                </span>
              </div>
              
              {/* Mashina ma'lumotlari */}
              <div className="flex items-center gap-1.5 truncate ml-2">
                <span className="truncate">{car.make} {car.model}</span>
                {car.year && (
                  <span className={`flex-shrink-0 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    ({car.year})
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Agar 3 tadan ko'p mashina bo'lsa */}
          {customer.cars.length > 3 && (
            <div className={`text-xs text-center pt-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              +{customer.cars.length - 3} ta yana
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Customers;
