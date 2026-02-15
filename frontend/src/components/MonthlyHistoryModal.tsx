import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { transactionApi } from '@/lib/api';

interface MonthlyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthlyHistoryModal: React.FC<MonthlyHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ 
    isOpen: false, 
    item: null 
  });
  const [deleting, setDeleting] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const isDarkMode = React.useMemo(() => {
    return localStorage.getItem('darkMode') === 'true';
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await transactionApi.getMonthlyHistory(12);
      setHistory(response.history || []);
    } catch (error) {
      console.error('Tarix yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1];
  };

  const toggleMonth = (monthId: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthId)) {
        newSet.delete(monthId);
      } else {
        newSet.add(monthId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return;
    
    setDeleting(true);
    try {
      await transactionApi.deleteMonthlyHistory(deleteConfirm.item._id);
      
      // Ro'yxatdan o'chirish
      setHistory(prev => prev.filter(h => h._id !== deleteConfirm.item._id));
      
      setDeleteConfirm({ isOpen: false, item: null });
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden mx-2 sm:mx-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900' 
            : 'bg-gradient-to-r from-red-600 to-red-700'
        }`}>
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-white/80 hover:text-white rounded-lg p-1 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-white" />
            <h2 className="text-base font-bold text-white">{t("Oylik tarix", language)}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(95vh-80px)] overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${
                isDarkMode 
                  ? 'border-red-900/30 border-t-red-600' 
                  : 'border-red-200 border-t-red-600'
              }`}></div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('Yuklanmoqda...', language)}
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t("Tarix mavjud emas", language)}
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {t("Oylik reset qilganingizdan keyin tarix paydo bo'ladi", language)}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const isExpanded = expandedMonths.has(item._id);
                
                return (
                  <div 
                    key={item._id}
                    className={`rounded-lg overflow-hidden ${
                      isDarkMode 
                        ? 'border border-red-900/30 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
                        : 'border border-gray-200 bg-white'
                    }`}
                  >
                    {/* Month Header - Clickable */}
                    <div 
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-800/50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleMonth(item._id)}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
                        <div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {getMonthName(item.month)} {item.year}
                          </h3>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(item.resetDate).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.balance)}
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(e, item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'text-red-500 hover:bg-red-900/20' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={t("O'chirish", language)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        ) : (
                          <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className={`px-3 pb-3 space-y-3 ${
                        isDarkMode 
                          ? 'border-t border-red-900/30' 
                          : 'border-t border-gray-100'
                      }`}>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                          {/* KIRIM CARD */}
                          <div className={`rounded-lg p-2 ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-green-900/20 via-green-800/10 to-gray-900/50 border border-green-900/30' 
                              : 'bg-green-50'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                              <span className={`text-xs font-semibold ${
                                isDarkMode ? 'text-green-400' : 'text-green-700'
                              }`}>{t('Kirim', language)}</span>
                            </div>
                            <div className={`text-base font-bold mb-1 ${
                              isDarkMode ? 'text-green-400' : 'text-green-900'
                            }`}>
                              {formatCurrency(item.totalIncome)}
                            </div>
                            <div className="flex gap-1.5 text-xs">
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-green-500 mb-0.5' : 'text-green-600 mb-0.5'}>
                                  {t('Naqd', language)}
                                </p>
                                <p className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-900'}`}>
                                  {formatCurrency(item.incomeCash || 0)}
                                </p>
                              </div>
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-green-500 mb-0.5' : 'text-green-600 mb-0.5'}>
                                  {t('Karta', language)}
                                </p>
                                <p className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-900'}`}>
                                  {formatCurrency(item.incomeCard || 0)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* CHIQIM CARD */}
                          <div className={`rounded-lg p-2 ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-red-900/20 via-red-800/10 to-gray-900/50 border border-red-900/30' 
                              : 'bg-red-50'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                              <span className={`text-xs font-semibold ${
                                isDarkMode ? 'text-red-400' : 'text-red-700'
                              }`}>{t('Chiqim', language)}</span>
                            </div>
                            <div className={`text-base font-bold mb-1 ${
                              isDarkMode ? 'text-red-400' : 'text-red-900'
                            }`}>
                              {formatCurrency(item.totalExpense)}
                            </div>
                            <div className="flex gap-1.5 text-xs">
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-red-500 mb-0.5' : 'text-red-600 mb-0.5'}>
                                  {t('Naqd', language)}
                                </p>
                                <p className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                                  {formatCurrency(item.expenseCash || 0)}
                                </p>
                              </div>
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-red-500 mb-0.5' : 'text-red-600 mb-0.5'}>
                                  {t('Karta', language)}
                                </p>
                                <p className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                                  {formatCurrency(item.expenseCard || 0)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* BALANS CARD */}
                          <div className={`rounded-lg p-2 ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-red-900/30' 
                              : 'bg-blue-50'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <BarChart3 className={`h-3.5 w-3.5 ${isDarkMode ? 'text-red-500' : 'text-blue-600'}`} />
                              <span className={`text-xs font-semibold ${
                                isDarkMode ? 'text-red-400' : 'text-blue-700'
                              }`}>{t('Balans', language)}</span>
                            </div>
                            <div className={`text-base font-bold mb-1 ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.balance)}
                            </div>
                            <div className="flex gap-1.5 text-xs">
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-red-500 mb-0.5' : 'text-blue-600 mb-0.5'}>
                                  {t('Naqd', language)}
                                </p>
                                <p className={`font-bold ${(item.balanceCash || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(item.balanceCash || 0)}
                                </p>
                              </div>
                              <div className={`flex-1 rounded p-1 ${
                                isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'
                              }`}>
                                <p className={isDarkMode ? 'text-red-500 mb-0.5' : 'text-blue-600 mb-0.5'}>
                                  {t('Karta', language)}
                                </p>
                                <p className={`font-bold ${(item.balanceCard || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(item.balanceCard || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Xodimlar daromadi */}
                        {item.userEarnings && item.userEarnings.length > 0 && (
                          <div>
                            <h4 className={`text-xs font-bold mb-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-700'
                            }`}>{t("Xodimlar daromadi", language)}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {item.userEarnings.map((user: any) => (
                                <div 
                                  key={user.userId} 
                                  className={`flex items-center justify-between rounded-lg p-2 ${
                                    isDarkMode 
                                      ? 'bg-gray-800/50 border border-red-900/20' 
                                      : 'bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
                                      isDarkMode 
                                        ? 'bg-gradient-to-br from-red-600 to-red-800' 
                                        : 'bg-blue-100'
                                    }`}>
                                      <span className={`font-bold text-xs ${
                                        isDarkMode ? 'text-white' : 'text-blue-700'
                                      }`}>
                                        {user.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className={`text-sm font-semibold ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                      }`}>{user.name}</p>
                                      <p className={`text-xs ${
                                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                      }`}>
                                        {user.role === 'master' ? t('Usta', language) : t('Shogird', language)}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-green-600">{formatCurrency(user.earnings)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.item && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm({ isOpen: false, item: null })} />
          
          <div className={`relative rounded-xl shadow-2xl max-w-sm w-full p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-red-900/30' 
              : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-red-900/30 to-red-800/20' 
                  : 'bg-red-100'
              }`}>
                <Trash2 className={`h-8 w-8 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {t("Tarixni o'chirish", language)}
              </h3>
              
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className="font-bold">{getMonthName(deleteConfirm.item.month)} {deleteConfirm.item.year}</span> {t("oyining tarixini o'chirmoqchimisiz?", language)}
              </p>
              
              <p className={`text-xs mb-6 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {t("Bu amalni bekor qilib bo'lmaydi!", language)}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, item: null })}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                    isDarkMode 
                      ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {t('O\'chirilmoqda...', language)}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t("O'chirish", language)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyHistoryModal;
