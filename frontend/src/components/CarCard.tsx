import React from 'react';
import { Car } from '@/types';
import { Eye, Edit, Trash2, DollarSign, Phone, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import toast from 'react-hot-toast';

interface CarCardProps {
  car: Car;
  displayTotal: number;
  language: 'latin' | 'cyrillic';
  isDarkMode: boolean;
  onView: (car: Car) => void;
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
  onPayment: (car: Car) => void;
  getSmsMessage: (car: Car) => string;
}

const CarCard: React.FC<CarCardProps> = ({
  car,
  displayTotal,
  language,
  isDarkMode,
  onView,
  onEdit,
  onDelete,
  onPayment,
  getSmsMessage,
}) => {
  const paidAmount = car.paidAmount || 0;
  const remainingAmount = displayTotal - paidAmount;
  const paymentProgress = displayTotal > 0 ? (paidAmount / displayTotal) * 100 : 0;
  const hasDebt = remainingAmount > 0;

  // Status configuration
  const getStatusConfig = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'pending':
          return {
            bg: 'bg-gradient-to-r from-amber-900/40 to-yellow-900/40',
            text: 'text-amber-400',
            border: 'border-amber-700/50',
            dot: 'bg-amber-500'
          };
        case 'in-progress':
          return {
            bg: 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40',
            text: 'text-blue-400',
            border: 'border-blue-700/50',
            dot: 'bg-blue-500'
          };
        case 'completed':
          return {
            bg: 'bg-gradient-to-r from-green-900/40 to-emerald-900/40',
            text: 'text-green-400',
            border: 'border-green-700/50',
            dot: 'bg-green-500'
          };
        case 'delivered':
          return {
            bg: 'bg-gradient-to-r from-gray-800/40 to-slate-800/40',
            text: 'text-gray-400',
            border: 'border-gray-700/50',
            dot: 'bg-gray-500'
          };
        default:
          return {
            bg: 'bg-gray-800/40',
            text: 'text-gray-400',
            border: 'border-gray-700/50',
            dot: 'bg-gray-500'
          };
      }
    } else {
      switch (status) {
        case 'pending':
          return {
            bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
            text: 'text-amber-700',
            border: 'border-amber-200',
            dot: 'bg-amber-500'
          };
        case 'in-progress':
          return {
            bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            dot: 'bg-blue-500'
          };
        case 'completed':
          return {
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            text: 'text-green-700',
            border: 'border-green-200',
            dot: 'bg-green-500'
          };
        case 'delivered':
          return {
            bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
            text: 'text-gray-700',
            border: 'border-gray-200',
            dot: 'bg-gray-500'
          };
        default:
          return {
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            border: 'border-gray-200',
            dot: 'bg-gray-500'
          };
      }
    }
  };

  const statusConfig = getStatusConfig(car.status);

  return (
    <div className={`group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border flex flex-col ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
        : 'bg-white border-gray-200 hover:border-orange-300'
    }`}>
      {/* Debt indicator stripe */}
      {hasDebt && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600'
            : 'bg-gradient-to-r from-orange-600 via-red-500 to-orange-600'
        }`}></div>
      )}

      {/* Card Header */}
      <div className={`p-4 sm:p-6 border-b ${
        isDarkMode ? 'border-red-900/30' : 'border-gray-100'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className={`flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-600 to-red-800'
                : 'bg-gradient-to-br from-orange-500 to-red-600'
            }`}>
              <span className="text-white font-bold text-lg sm:text-xl">
                {car.ownerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base sm:text-lg font-bold truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {car.ownerName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Phone className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <span className={`text-xs sm:text-sm truncate ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {car.ownerPhone}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`flex-shrink-0 inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}></span>
            {car.status === 'pending' && t('Kutilmoqda', language)}
            {car.status === 'in-progress' && t('Jarayonda', language)}
            {car.status === 'completed' && t('Tayyor', language)}
            {car.status === 'delivered' && t('Topshirilgan', language)}
          </span>
        </div>

        {/* Car Info */}
        <div className={`flex items-center justify-between p-3 sm:p-4 rounded-xl ${
          isDarkMode
            ? 'bg-gray-800/50 border border-red-900/20'
            : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100'
        }`}>
          <div className="flex-1 min-w-0">
            <p className={`text-sm sm:text-base font-bold truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {car.make} {car.carModel}
            </p>
            <p className={`text-xs sm:text-sm mt-0.5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {car.year}
            </p>
          </div>
          <span className={`flex-shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black shadow-sm ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
          }`}>
            {car.licensePlate}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 sm:p-6 space-y-4 flex-1">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Total Amount */}
          <div className={`p-3 sm:p-4 rounded-xl ${
            isDarkMode
              ? 'bg-gray-800/50 border border-red-900/20'
              : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${
                isDarkMode ? 'text-red-400' : 'text-orange-600'
              }`} />
            </div>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('Jami', language)}
            </p>
            <p className={`text-sm sm:text-base font-bold mt-1 truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatCurrency(displayTotal, language)}
            </p>
          </div>

          {/* Paid Amount */}
          <div className={`p-3 sm:p-4 rounded-xl ${
            isDarkMode
              ? 'bg-gray-800/50 border border-red-900/20'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t("To'langan", language)}
            </p>
            <p className={`text-sm sm:text-base font-bold mt-1 truncate ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {formatCurrency(paidAmount, language)}
            </p>
          </div>

          {/* Remaining Amount */}
          <div className={`p-3 sm:p-4 rounded-xl ${
            isDarkMode
              ? 'bg-gray-800/50 border border-red-900/20'
              : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('Qolgan', language)}
            </p>
            <p className={`text-sm sm:text-base font-bold mt-1 truncate ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {formatCurrency(remainingAmount, language)}
            </p>
          </div>
        </div>

        {/* Payment Progress */}
        <div className={`p-3 sm:p-4 rounded-xl ${
          isDarkMode
            ? 'bg-gray-800/50 border border-red-900/20'
            : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs sm:text-sm font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t("To'lov jarayoni", language)}
            </span>
            <span className={`text-xs sm:text-sm font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {paymentProgress.toFixed(1)}%
            </span>
          </div>
          <div className={`w-full rounded-full h-2 sm:h-2.5 overflow-hidden ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                paymentProgress === 100
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}
              style={{ width: `${paymentProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`p-4 sm:p-6 border-t mt-auto ${
        isDarkMode ? 'border-red-900/30 bg-gray-800/30' : 'border-gray-100 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          {/* To'lov button - katta */}
          <button
            onClick={() => onPayment(car)}
            className={`flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
              isDarkMode
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }`}
          >
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" />
            <span className="hidden xs:inline">{t("To'lov", language)}</span>
            <span className="xs:hidden">{t("To'lov", language)}</span>
          </button>

          {/* SMS button - katta */}
          {car.ownerPhone && (
            <a
              href={`sms:${car.ownerPhone}?body=${encodeURIComponent(getSmsMessage(car))}`}
              className={`flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }`}
              onClick={(e) => {
                if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                  e.preventDefault();
                  toast.error(t('SMS yuborish faqat mobil qurilmalarda ishlaydi', language));
                }
              }}
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" />
              <span className="hidden xs:inline">{t("SMS", language)}</span>
              <span className="xs:hidden">{t("SMS", language)}</span>
            </a>
          )}

          {/* Ko'rish button - icon only */}
          <button
            onClick={() => onView(car)}
            className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
              isDarkMode
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-red-900/30'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={t("Ko'rish", language)}
          >
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Tahrirlash button - icon only */}
          <button
            onClick={() => onEdit(car)}
            className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
            title={t('Tahrirlash', language)}
          >
            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* O'chirish button - icon only */}
          <button
            onClick={() => onDelete(car)}
            className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={t("O'chirish", language)}
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
