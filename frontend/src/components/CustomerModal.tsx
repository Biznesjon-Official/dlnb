import { X, Phone, Calendar, Car as CarIcon, CreditCard } from 'lucide-react';
import { useCustomerDetails } from '../hooks/useCustomers';

interface CustomerModalProps {
  customerId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

const CustomerModal = ({ customerId, isDarkMode, onClose }: CustomerModalProps) => {
  const { data, isLoading } = useCustomerDetails(customerId);

  // Loading holatida ham modal ko'rsatamiz, faqat skeleton bilan
  const customer = data?.customer;
  const cars = data?.cars || [];
  const debts = data?.debts || [];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-6 py-4 border-b ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 border-red-900/30'
              : 'bg-gradient-to-r from-rose-500 to-pink-600 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-white/20 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white truncate">{customer?.name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-white/90 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{customer?.phone}</span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white flex-shrink-0 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Statistika - Ixcham */}
          <div className="grid grid-cols-2 gap-3">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="h-4 w-16 bg-gray-300/20 rounded animate-pulse mb-2" />
                    <div className="h-6 w-24 bg-gray-300/20 rounded animate-pulse" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-rose-600'}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Qarz
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {customer?.totalDebt.toLocaleString()} so'm
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      To'langan
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {customer?.totalPaid.toLocaleString()} so'm
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CarIcon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Mashinalar
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {customer?.carsCount} ta
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Oxirgi tashrif
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {customer && new Date(customer.lastVisit).toLocaleDateString('uz-UZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Mashinalar - Ixcham */}
          {!isLoading && cars.length > 0 && (
            <div>
              <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Mashinalar ({cars.length})
              </h3>
              <div className="space-y-2">
                {cars.map((car) => (
                  <div
                    key={car._id}
                    className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CarIcon className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {car.make} {car.carModel} ({car.year})
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {car.licensePlate}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          car.status === 'completed'
                            ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : car.status === 'in-progress'
                            ? isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                            : isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {car.status === 'completed' ? 'Tugallangan' : car.status === 'in-progress' ? 'Jarayonda' : 'Kutilmoqda'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qarzlar - Ixcham */}
          {!isLoading && debts.length > 0 && (
            <div>
              <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Qarzlar ({debts.length})
              </h3>
              <div className="space-y-2">
                {debts.map((debt) => (
                  <div
                    key={debt._id}
                    className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800/50 border-red-900/30' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {debt.description}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {debt.amount.toLocaleString()} so'm
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          debt.status === 'paid'
                            ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : debt.status === 'partial'
                            ? isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {debt.status === 'paid' ? 'To\'langan' : debt.status === 'partial' ? 'Qisman' : 'To\'lanmagan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
