import React, { useState } from 'react';
import { X, Users, CreditCard, DollarSign } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useUsers } from '@/hooks/useUsers';
import { useTheme } from '@/contexts/ThemeContext';

interface SalaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

interface EmployeeSalary {
  id: string;
  userId?: string;
  name: string;
  baseSalary: number;
  baseSalaryDisplay: string;
  totalSalary: number;
}

const SalaryExpenseModal: React.FC<SalaryExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const { isDarkMode } = useTheme();
  const [employee, setEmployee] = useState<EmployeeSalary>({
    id: '1',
    userId: '',
    name: '',
    baseSalary: 0,
    baseSalaryDisplay: '',
    totalSalary: 0
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: usersData, isLoading: apprenticesLoading } = useUsers();
  const allUsers = usersData?.users || [];
  
  // Faqat shogirdlarni filtrlash (role === 'apprentice')
  const apprentices = allUsers.filter((user: any) => user.role === 'apprentice');

  if (!isOpen) return null;

  // Shogirdni tanlash - faqat ism va ID, summa bo'sh
  const handleApprenticeSelect = (userId: string) => {
    const selectedApprentice = apprentices.find((app: any) => app._id === userId);
    
    if (selectedApprentice) {
      setEmployee({
        id: '1',
        userId: selectedApprentice._id,
        name: selectedApprentice.name,
        baseSalary: 0,
        baseSalaryDisplay: '',
        totalSalary: 0
      });
    }
  };

  const updateEmployeeAmount = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setEmployee({
      ...employee,
      baseSalary: numericValue,
      baseSalaryDisplay: formatted,
      totalSalary: numericValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (employee.totalSalary <= 0) {
      alert(t('To\'lov summasi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    if (!employee.name.trim()) {
      alert(t('Xodim ismini kiriting', language));
      return;
    }

    if (!employee.userId) {
      alert(t('Shogirdni tanlang', language));
      return;
    }
    
    // Agar shogird tanlangan bo'lsa va to'lov summasi uning daromadidan katta bo'lsa
    const selectedApprentice = apprentices.find((app: any) => app._id === employee.userId);
    if (selectedApprentice && employee.totalSalary > selectedApprentice.earnings) {
      const confirmed = window.confirm(
        t('To\'lov summasi shogirdning daromadidan ko\'p. Davom etasizmi?', language)
      );
      if (!confirmed) {
        return;
      }
    }

    const fullDescription = `${t('Xodim', language)}: ${employee.name}
${t('Maosh', language)}: ${formatCurrency(employee.totalSalary)}`;

    await onSuccess({
      amount: employee.totalSalary,
      description: fullDescription,
      paymentMethod: paymentMethod,
      apprenticeId: employee.userId
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className={`relative rounded-2xl shadow-2xl max-w-lg w-full ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`p-4 rounded-t-2xl ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-pink-700'
              : 'bg-gradient-to-r from-red-600 to-pink-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-red-200' : 'text-red-100'
                  }`}>
                    {t('Shogird maoshini to\'lash', language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shogird tanlash */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Users className="h-4 w-4 inline mr-1" />
                  {t('Shogirdni tanlang', language)} *
                </label>
                <select
                  value={employee.userId || ''}
                  onChange={(e) => handleApprenticeSelect(e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30 text-white focus:border-red-500'
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  disabled={apprenticesLoading}
                  required
                >
                  <option value="">{t('Tanlang...', language)}</option>
                  {apprentices.map((apprentice: any) => (
                    <option key={apprentice._id} value={apprentice._id}>
                      {apprentice.name}
                    </option>
                  ))}
                </select>
                {employee.userId && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <DollarSign className="h-3 w-3" />
                    {t('Hozirgi balans', language)}: {formatCurrency(
                      apprentices.find((a: any) => a._id === employee.userId)?.earnings || 0
                    )} {t('(faqat ma\'lumot uchun)', language)}
                  </p>
                )}
              </div>

              {/* Xodim ismi */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('Xodim ismi', language)} *
                </label>
                <input
                  type="text"
                  value={employee.name}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    employee.userId 
                      ? isDarkMode
                        ? 'bg-gray-900 border-gray-700 text-gray-500'
                        : 'bg-gray-100 border-gray-200'
                      : isDarkMode
                        ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-500'
                        : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder={t('To\'liq ism...', language)}
                  required
                  readOnly={!!employee.userId}
                />
              </div>

              {/* To'lov summasi */}
              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <DollarSign className={`h-4 w-4 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                  {t('To\'lov summasi', language)} *
                </label>
                <input
                  type="text"
                  value={employee.baseSalaryDisplay}
                  onChange={(e) => updateEmployeeAmount(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all text-lg font-semibold ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-500'
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="1,000,000"
                  required
                />
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {t('Shogirdga to\'lanadigan summani qo\'lda kiriting', language)}
                </p>
                {employee.userId && employee.totalSalary > 0 && (
                  <div className="mt-2">
                    {(() => {
                      const apprenticeEarnings = apprentices.find((a: any) => a._id === employee.userId)?.earnings || 0;
                      if (employee.totalSalary > apprenticeEarnings) {
                        return (
                          <p className={`text-xs flex items-center gap-1 ${
                            isDarkMode ? 'text-orange-400' : 'text-orange-600'
                          }`}>
                            ⚠️ {t('To\'lov summasi shogirdning daromadidan ko\'p', language)} ({formatCurrency(apprenticeEarnings)})
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30 text-white focus:border-red-500'
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Jami summa */}
              <div className={`p-4 rounded-xl border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                  : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${
                    isDarkMode ? 'text-red-300' : 'text-red-900'
                  }`}>{t('Jami to\'lov summasi', language)}:</span>
                  <span className={`text-2xl font-bold ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {formatCurrency(employee.totalSalary)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className={`flex items-center justify-end space-x-3 pt-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                    isDarkMode
                      ? 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  disabled={employee.totalSalary <= 0}
                  className={`px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-600 via-red-700 to-pink-700 hover:from-red-700 hover:via-red-800 hover:to-pink-800'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                  }`}
                >
                  {t("Maosh to'lovini qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryExpenseModal;
