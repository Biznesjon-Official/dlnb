import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, User } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';

interface UserStats {
  userId: string;
  userName: string;
  income: {
    cash: number;
    card: number;
    click: number;
    total: number;
    count: number;
  };
  expense: {
    cash: number; 
    card: number;
    click: number;
    total: number;
    count: number;
  };
}

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense' | 'balance';
  userStats: UserStats[];
  currentUserId?: string;
  language: 'latin' | 'cyrillic';
}

const UserStatsModal: React.FC<UserStatsModalProps> = ({
  isOpen,
  onClose,
  type,
  userStats,
  currentUserId,
  language
}) => {
  // Body scroll'ni to'xtatish
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'income':
        return t('Kirim - Ustozlar bo\'yicha', language);
      case 'expense':
        return t('Chiqim - Ustozlar bo\'yicha', language);
      case 'balance':
        return t('Balans - Ustozlar bo\'yicha', language);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
      case 'balance':
        return <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'income':
        return {
          gradient: 'from-green-500 to-emerald-600',
          headerBg: 'bg-green-500'
        };
      case 'expense':
        return {
          gradient: 'from-red-500 to-pink-600',
          headerBg: 'bg-red-500'
        };
      case 'balance':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          headerBg: 'bg-blue-500'
        };
    }
  };

  const colors = getColorClasses();

  const sortedUsers = [...userStats].sort((a, b) => {
    if (type === 'income') {
      return b.income.total - a.income.total;
    } else if (type === 'expense') {
      return b.expense.total - a.expense.total;
    } else {
      const balanceA = a.income.total - a.expense.total;
      const balanceB = b.income.total - b.expense.total;
      return balanceB - balanceA;
    }
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl lg:max-w-3xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={`p-1.5 sm:p-2 ${colors.headerBg} rounded-lg shadow-lg flex-shrink-0`}>
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                  {getTitle()}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0 hover:rotate-90"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2 sm:space-y-2.5">
            {sortedUsers.map((user, index) => {
              const isCurrentUser = user.userId === currentUserId;
              const balance = user.income.total - user.expense.total;
              const cashBalance = user.income.cash - user.expense.cash;
              const cardBalance = user.income.card - user.expense.card;

              return (
                <div
                  key={user.userId}
                  className={`relative overflow-hidden rounded-lg p-2.5 sm:p-3 border-2 bg-white transition-all duration-300 hover:shadow-md ${
                    isCurrentUser ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  {/* Rank Badge - Compact */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-gray-100 text-gray-700 border-2 border-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* User Info - Compact */}
                  <div className="mb-2 pr-8">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded ${isCurrentUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <User className={`h-3 w-3 ${isCurrentUser ? 'text-blue-700' : 'text-gray-700'}`} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {user.userName}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                          {t('Siz', language)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid - Compact 3 columns */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {/* Kirim Card - Compact */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-1.5 sm:p-2 border border-green-200">
                      <div className="flex items-center gap-0.5 mb-1">
                        <div className="p-0.5 bg-green-500 rounded">
                          <TrendingUp className="h-2 w-2 text-white" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-green-700">
                          {t('Kirim', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1">
                        <p className="text-[7px] sm:text-[8px] text-green-600">{t('Umumiy', language)}</p>
                        <div className="text-xs sm:text-sm font-bold text-green-900 truncate">
                          {formatCurrency(user.income.total, language)}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-green-600">{t('Naqd', language)}</p>
                          <div className="text-[10px] sm:text-xs font-bold text-green-900 truncate">
                            {formatCurrency(user.income.cash, language)}
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-green-600">{t('Karta', language)}</p>
                          <div className="text-[10px] sm:text-xs font-bold text-green-900 truncate">
                            {formatCurrency(user.income.card, language)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chiqim Card - Compact */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-1.5 sm:p-2 border border-red-200">
                      <div className="flex items-center gap-0.5 mb-1">
                        <div className="p-0.5 bg-red-500 rounded">
                          <TrendingDown className="h-2 w-2 text-white" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-red-700">
                          {t('Chiqim', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1">
                        <p className="text-[7px] sm:text-[8px] text-red-600">{t('Umumiy', language)}</p>
                        <div className="text-xs sm:text-sm font-bold text-red-900 truncate">
                          {formatCurrency(user.expense.total, language)}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-red-600">{t('Naqd', language)}</p>
                          <div className="text-[10px] sm:text-xs font-bold text-red-900 truncate">
                            {formatCurrency(user.expense.cash, language)}
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-red-600">{t('Karta', language)}</p>
                          <div className="text-[10px] sm:text-xs font-bold text-red-900 truncate">
                            {formatCurrency(user.expense.card, language)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Balans Card - Compact */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-1.5 sm:p-2 border border-blue-200">
                      <div className="flex items-center gap-0.5 mb-1">
                        <div className="p-0.5 bg-blue-500 rounded">
                          <BarChart3 className="h-2 w-2 text-white" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-blue-700">
                          {t('Balans', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1">
                        <p className="text-[7px] sm:text-[8px] text-blue-600">{t('Umumiy', language)}</p>
                        <div className={`text-xs sm:text-sm font-bold truncate ${balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          {formatCurrency(balance, language)}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-blue-600">{t('Naqd', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${cashBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            {formatCurrency(cashBalance, language)}
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded px-1 py-0.5">
                          <p className="text-[7px] text-blue-600">{t('Karta', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${cardBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            {formatCurrency(cardBalance, language)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsModal;
