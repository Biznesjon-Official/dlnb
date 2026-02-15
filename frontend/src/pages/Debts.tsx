import React, { useState, useMemo } from 'react';
import { useDebtsNew } from '@/hooks/useDebtsNew';
import EditDebtModal from '@/components/EditDebtModal';
import DeleteDebtModal from '@/components/DeleteDebtModal';
import DebtsSkeleton from '@/components/DebtsSkeleton';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Phone, Eye, Edit, Trash2, X, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

// Local Debt type from hook
type Debt = {
  _id: string;
  creditorName: string;
  creditorPhone?: string;
  amount: number;
  paidAmount: number;
  type: 'receivable' | 'payable';
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  description?: string;
  paymentHistory?: Array<{
    amount: number;
    date: string;
    notes?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
};

const Debts: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // ⚡ ULTRA FAST: Yangi optimallashtirilgan hook
  const { 
    debts: allDebts, 
    summary: debtSummary, 
    loading: isLoading, 
    summaryLoading,
    updateDebt,
    deleteDebt 
  } = useDebtsNew({ type: typeFilter, status: statusFilter });

  // Faqat to'lanmagan va qisman to'langan qarzlarni ko'rsatish
  const debts = useMemo(() => 
    allDebts.filter((debt: Debt) => debt.status !== 'paid'),
    [allDebts]
  );



  const getTypeText = (type: string) => {
    return type === 'receivable' ? t('Bizga qarzi bor', language) : t('Bizning qarzimiz', language);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ');
  };

  const DebtDetailModal: React.FC<{ debt: Debt }> = ({ debt }) => {
    const isReceivable = debt.type === 'receivable';
    const remainingAmount = debt.amount - debt.paidAmount;
    const progressPercentage = (debt.paidAmount / debt.amount) * 100;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDebt(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden">
            {/* Header with Gradient */}
            <div className={`relative ${isReceivable 
              ? 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700' 
              : 'bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-700'
            } p-8`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl shadow-lg">
                    {isReceivable ? (
                      <TrendingUp className="h-8 w-8 text-white" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-2">{debt.creditorName}</h3>
                    <p className={`text-lg ${isReceivable ? 'text-orange-100' : 'text-amber-100'}`}>
                      {getTypeText(debt.type)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedDebt(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Amount Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{t('Umumiy summa', language)}</span>
                    <DollarSign className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(debt.amount)}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{t("To'langan", language)}</span>
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(debt.paidAmount)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">{t('Qolgan', language)}</span>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">{t("To'lov jarayoni", language)}</span>
                  <span className="text-sm font-bold text-gray-900">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercentage === 100 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                {(debt.creditorPhone || debt.dueDate) && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-5 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">{t("Qo'shimcha ma'lumot", language)}</h4>
                    <div className="space-y-3">
                      {debt.creditorPhone && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Phone className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('Telefon', language)}</p>
                            <p className="font-semibold text-gray-900">{debt.creditorPhone}</p>
                          </div>
                        </div>
                      )}
                      {debt.dueDate && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-amber-100 p-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t("To'lov muddati", language)}</p>
                            <p className="font-semibold text-gray-900">{formatDate(debt.dueDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {debt.description && (
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-5 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('Izoh', language)}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{debt.description}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("To'lov tarixi", language)}
                    </h4>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full">
                      {debt.paymentHistory.length} {t("ta to'lov", language)}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {debt.paymentHistory.map((payment, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <DollarSign className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">{payment.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            #{(debt.paymentHistory?.length || 0) - index}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedDebt(null)}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                {t('Yopish', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
        {/* Mobile-First Header */}
        <div className={`relative overflow-hidden rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8 ${
          isDarkMode
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700'
        }`}>
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">{t("Qarz daftarchasi", language)}</h1>
                <p className="text-orange-100 text-xs sm:text-base lg:text-lg">
                  {debts.length} ta qarz mavjud
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Receivables Card */}
          <div className={`group relative rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
              : 'bg-white border-gray-100 hover:border-orange-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50 ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-900/50 to-red-800/50'
                : 'bg-gradient-to-br from-orange-100 to-red-100'
            }`}></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800'
                    : 'bg-gradient-to-br from-orange-500 to-red-600'
                }`}>
                  <TrendingUp className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'text-red-400' : 'text-orange-600'
                  }`}>
                    {t("Bizga qarzi", language)}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(debtSummary as any)?.receivables?.count || 0} {t("mijoz", language)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className={`text-lg sm:text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.receivables?.remaining || 0)
                  )}
                </p>
                <div className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Jami:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency((debtSummary as any)?.receivables?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payables Card */}
          <div className={`group relative rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
              : 'bg-white border-gray-100 hover:border-orange-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50 ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-900/50 to-red-800/50'
                : 'bg-gradient-to-br from-orange-100 to-amber-100'
            }`}></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                }`}>
                  <TrendingDown className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'text-red-400' : 'text-orange-600'
                  }`}>
                    {t("Bizning qarzi", language)}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(debtSummary as any)?.payables?.count || 0} {t("ta'minotchi", language)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className={`text-lg sm:text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.payables?.remaining || 0)
                  )}
                </p>
                <div className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Jami:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency((debtSummary as any)?.payables?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Position Card */}
          <div className={`group relative rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 sm:col-span-2 lg:col-span-1 ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
              : 'bg-white border-gray-100 hover:border-orange-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50 ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-900/50 to-red-800/50'
                : 'bg-gradient-to-br from-orange-100 to-yellow-100'
            }`}></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800'
                    : 'bg-gradient-to-br from-orange-500 to-yellow-600'
                }`}>
                  <DollarSign className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'text-red-400' : 'text-orange-600'
                  }`}>
                    {t("Holat", language)}
                  </p>
                  <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                    ((debtSummary as any)?.netPosition || 0) >= 0 
                      ? isDarkMode ? 'text-green-400' : 'text-orange-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {((debtSummary as any)?.netPosition || 0) >= 0 ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span>{t('Ijobiy', language)}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        <span>{t('Salbiy', language)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className={`text-lg sm:text-3xl font-bold ${
                  ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.netPosition || 0)
                  )}
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {((debtSummary as any)?.netPosition || 0) >= 0 
                      ? t('Qabul qilinadigan qarzlar ko\'proq', language)
                      : t('To\'lanadigan qarzlar ko\'proq', language)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Filters */}
        <div className={`rounded-lg sm:rounded-2xl shadow-lg border p-3 sm:p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`flex-1 px-3 py-3 border rounded-xl transition-all text-sm font-medium appearance-none cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
              }`}
            >
              <option value="">{t("Barcha turlar", language)}</option>
              <option value="receivable">{t("Bizga qarzi bor", language)}</option>
              <option value="payable">{t("Bizning qarzimiz", language)}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`flex-1 px-3 py-3 border rounded-xl transition-all text-sm font-medium appearance-none cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
              }`}
            >
              <option value="">{t("Barcha holatlar", language)}</option>
              <option value="pending">{t("To'lanmagan", language)}</option>
              <option value="partial">{t("Qisman to'langan", language)}</option>
              <option value="paid">{t("To'langan", language)}</option>
            </select>
          </div>
        </div>

        {/* Debts List */}
        {isLoading ? (
          <DebtsSkeleton />
        ) : debts.length === 0 ? (
          <div className={`rounded-lg sm:rounded-2xl shadow-lg border p-6 sm:p-16 text-center ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}>
            <div className="max-w-md mx-auto">
              <div className={`rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-900/30 to-red-800/30'
                  : 'bg-gradient-to-br from-orange-50 to-red-50'
              }`}>
                <DollarSign className={`h-8 w-8 sm:h-12 sm:w-12 ${
                  isDarkMode ? 'text-red-400' : 'text-orange-600'
                }`} />
              </div>
              <h3 className={`text-lg sm:text-2xl font-bold mb-2 sm:mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {t("Qarzlar topilmadi", language)}
              </h3>
              <p className={`mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t("Qarzlar avtomatik ravishda mashina to'lovi qisman to'langanda yaratiladi.", language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {debts.map((debt: Debt) => {
              const isReceivable = debt.type === 'receivable';
              const remainingAmount = debt.amount - debt.paidAmount;
              const progressPercentage = (debt.paidAmount / debt.amount) * 100;

              return (
                <div
                  key={debt._id}
                  className={`group relative rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
                      : 'bg-white border-gray-100 hover:border-orange-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-3 sm:p-6 pb-4 sm:pb-8 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                      : isReceivable 
                        ? 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700' 
                        : 'bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                        <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                          {isReceivable ? (
                            <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          ) : (
                            <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-white mb-1 break-words">
                            {debt.creditorName}
                          </h3>
                          <p className={`text-xs sm:text-sm ${
                            isDarkMode ? 'text-red-100' : isReceivable ? 'text-orange-100' : 'text-amber-100'
                          }`}>
                            {getTypeText(debt.type)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    {/* Amount Info */}
                    <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-red-900/30'
                        : 'bg-gradient-to-r from-gray-50 to-blue-50/50 border-gray-100'
                    }`}>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold uppercase ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {t("Umumiy", language)}
                          </span>
                          <span className={`text-sm sm:text-base font-bold ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {formatCurrency(debt.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold uppercase ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {t("To'langan", language)}
                          </span>
                          <span className={`text-sm sm:text-base font-bold ${
                            isDarkMode ? 'text-green-400' : 'text-orange-600'
                          }`}>
                            {formatCurrency(debt.paidAmount)}
                          </span>
                        </div>
                        <div className={`pt-1.5 sm:pt-2 border-t ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className={`text-xs font-semibold uppercase ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {t("Qolgan", language)}
                            </span>
                            <span className={`text-sm sm:text-lg font-bold ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className={`w-full rounded-full h-1.5 sm:h-2 overflow-hidden ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDarkMode
                                  ? progressPercentage === 100 ? 'bg-green-500' : 'bg-red-500'
                                  : progressPercentage === 100 ? 'bg-orange-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <p className={`text-xs mt-1 text-right ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {progressPercentage.toFixed(0)}% {t("to'langan", language)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Date Info */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {debt.creditorPhone && (
                        <div className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <Phone className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className="font-medium truncate">{debt.creditorPhone}</span>
                        </div>
                      )}
                      {debt.dueDate && (
                        <div className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <Calendar className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span>{t("Muddat:", language)} <span className="font-medium">{formatDate(debt.dueDate)}</span></span>
                        </div>
                      )}
                      {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                        <div className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <FileText className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span>{debt.paymentHistory.length} {t("ta to'lov tarixi", language)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className={`flex items-stretch gap-2 pt-2 sm:pt-4 border-t ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <button 
                        onClick={() => setSelectedDebt(debt)}
                        className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group ${
                          isDarkMode
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        }`}
                        title={t("Ko'rish", language)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs sm:text-sm">{t("Ko'rish", language)}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDebt(debt);
                          setIsEditModalOpen(true);
                        }}
                        className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        title={t("Tahrirlash", language)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDebt(debt);
                          setIsDeleteModalOpen(true);
                        }}
                        className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                        }`}
                        title={t("O'chirish", language)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedDebt && !isEditModalOpen && !isDeleteModalOpen && <DebtDetailModal debt={selectedDebt} />}
      {selectedDebt && (
        <>
          <EditDebtModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt as any}
            onUpdate={updateDebt}
          />
          <DeleteDebtModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt as any}
            onDelete={deleteDebt}
          />
        </>
      )}
    </div>
  );
};

export default Debts;