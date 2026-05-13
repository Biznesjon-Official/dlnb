import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Receipt,
  Tag,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { transactionApi } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

interface MonthDetailModalProps {
  isOpen: boolean;
  year: number;
  month: number;
  onClose: () => void;
}

type TabKey = 'income' | 'expense' | 'staff' | 'transactions';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'income', label: 'Kirim', icon: TrendingUp },
  { key: 'expense', label: 'Chiqim', icon: TrendingDown },
  { key: 'staff', label: 'Xodimlar', icon: Users },
  { key: 'transactions', label: 'Tranzaksiyalar', icon: Receipt },
];

const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const MonthDetailModal: React.FC<MonthDetailModalProps> = ({ isOpen, year, month, onClose }) => {
  const { isDarkMode } = useTheme();
  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('income');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('income');
    setData(null);
    setError(null);
    setLoading(true);
    transactionApi
      .getMonthHistory(year, month)
      .then((res) => {
        setData(res?.history || null);
        if (!res?.history) setError("Ushbu oy uchun batafsil ma'lumot topilmadi");
      })
      .catch((err) => {
        console.error('Month detail xatosi:', err);
        setError("Ma'lumotni yuklab bo'lmadi");
      })
      .finally(() => setLoading(false));
  }, [isOpen, year, month]);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];
  const isLive = data?.isLive === true;
  const hasSnapshot = data?.hasDetailedSnapshot === true;

  const incomeCategories = (data?.categoriesBreakdown || []).filter((c: any) => c.type === 'income');
  const expenseCategories = (data?.categoriesBreakdown || []).filter((c: any) => c.type === 'expense');
  const apprentices = (data?.userEarnings || []).filter((u: any) => u.role === 'apprentice');
  const masters = (data?.userEarnings || []).filter((u: any) => u.role === 'master');
  const incomeTransactions = (data?.transactions || []).filter((tx: any) => tx.type === 'income');
  const expenseTransactions = (data?.transactions || []).filter((tx: any) => tx.type === 'expense');

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden mx-2 sm:mx-0 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
              : 'bg-gradient-to-r from-red-600 to-red-700'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white rounded-lg p-1 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-5 w-5 text-white" />
            <h2 className="text-base font-bold text-white">
              {monthName} {year}
            </h2>
            {isLive && (
              <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded">
                {t('Joriy oy', language)}
              </span>
            )}
            {!isLive && hasSnapshot && (
              <span className="text-[10px] font-bold bg-green-400 text-green-900 px-1.5 py-0.5 rounded">
                {t('Arxiv', language)}
              </span>
            )}
            {!hasSnapshot && (
              <span className="text-[10px] font-bold bg-orange-400 text-orange-900 px-1.5 py-0.5 rounded">
                {t('Eski arxiv', language)}
              </span>
            )}
          </div>
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="p-12 text-center">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${
                isDarkMode ? 'border-red-900/30 border-t-red-600' : 'border-red-200 border-t-red-600'
              }`}
            />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('Yuklanmoqda...', language)}</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-12 text-center">
            <p className={isDarkMode ? 'text-red-400' : 'text-red-600'}>{error}</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary cards */}
            <div className="px-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <SummaryCard
                label={t('Kirim', language)}
                amount={data.totalIncome}
                count={data.incomeCount}
                color="green"
                icon={TrendingUp}
                isDarkMode={isDarkMode}
              />
              <SummaryCard
                label={t('Chiqim', language)}
                amount={data.totalExpense}
                count={data.expenseCount}
                color="red"
                icon={TrendingDown}
                isDarkMode={isDarkMode}
              />
              <SummaryCard
                label={t('Balans', language)}
                amount={data.balance}
                color={data.balance >= 0 ? 'green' : 'red'}
                icon={Wallet}
                isDarkMode={isDarkMode}
              />
              <SummaryCard
                label={t('Naqd / Karta', language)}
                amount={data.balanceCash}
                amount2={data.balanceCard}
                color="blue"
                icon={Banknote}
                isDarkMode={isDarkMode}
                showBoth
              />
            </div>

            {/* Tabs */}
            <div className={`px-4 mt-4 border-b ${isDarkMode ? 'border-red-900/30' : 'border-gray-200'}`}>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? isDarkMode
                            ? 'border-red-500 text-red-400'
                            : 'border-red-600 text-red-600'
                          : isDarkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t(tab.label, language)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-4 max-h-[calc(95vh-300px)] overflow-y-auto scrollbar-hide">
              {activeTab === 'income' && (
                <CategoryBreakdown
                  title={t('Pul qayerdan keldi', language)}
                  categories={incomeCategories}
                  transactions={incomeTransactions}
                  type="income"
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}
              {activeTab === 'expense' && (
                <CategoryBreakdown
                  title={t('Pul qayerga sarflandi', language)}
                  categories={expenseCategories}
                  transactions={expenseTransactions}
                  type="expense"
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}
              {activeTab === 'staff' && (
                <StaffBreakdown
                  apprentices={apprentices}
                  masters={masters}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}
              {activeTab === 'transactions' && (
                <TransactionsList
                  transactions={data.transactions || []}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ───────────────── Sub-components ───────────────── */

interface SummaryCardProps {
  label: string;
  amount: number;
  amount2?: number;
  count?: number;
  color: 'green' | 'red' | 'blue';
  icon: React.ComponentType<{ className?: string }>;
  isDarkMode: boolean;
  showBoth?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  amount,
  amount2,
  count,
  color,
  icon: Icon,
  isDarkMode,
  showBoth,
}) => {
  const colorMap = {
    green: isDarkMode
      ? 'from-green-900/20 via-green-800/10 to-gray-900/50 border border-green-900/30 text-green-400'
      : 'bg-green-50 text-green-900',
    red: isDarkMode
      ? 'from-red-900/20 via-red-800/10 to-gray-900/50 border border-red-900/30 text-red-400'
      : 'bg-red-50 text-red-900',
    blue: isDarkMode
      ? 'from-gray-800 via-gray-900 to-gray-800 border border-red-900/30 text-blue-400'
      : 'bg-blue-50 text-blue-900',
  };
  const iconColor = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gradient-to-br ' + colorMap[color] : colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className={`text-[10px] font-semibold ${isDarkMode ? 'opacity-80' : ''}`}>{label}</span>
      </div>
      {showBoth ? (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-sm font-bold">
            <Banknote className="h-3 w-3" />
            {formatCurrency(amount || 0)}
          </div>
          <div className="flex items-center gap-1 text-sm font-bold">
            <CreditCard className="h-3 w-3" />
            {formatCurrency(amount2 || 0)}
          </div>
        </div>
      ) : (
        <>
          <div className="text-lg font-bold">{formatCurrency(amount || 0)}</div>
          {count !== undefined && (
            <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'opacity-60' : 'opacity-70'}`}>
              {count} ta
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface CategoryBreakdownProps {
  title: string;
  categories: any[];
  transactions: any[];
  type: 'income' | 'expense';
  isDarkMode: boolean;
  language: 'latin' | 'cyrillic';
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  title,
  categories,
  transactions,
  type,
  isDarkMode,
  language,
}) => {
  const totalAmount = categories.reduce((s, c) => s + c.amount, 0);
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  const accentColor = type === 'income' ? 'green' : 'red';

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {t("Bu oy uchun bu turdagi tranzaksiyalar yo'q", language)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>

      {/* Kategoriya progress bars */}
      <div className="space-y-2">
        {sorted.map((cat) => {
          const percent = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;
          return (
            <div key={cat.categoryName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Tag className={`h-3 w-3 text-${accentColor}-600`} />
                  <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {cat.categoryName}
                  </span>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                    ({cat.count} ta)
                  </span>
                </div>
                <span className={`font-bold text-${accentColor}-600`}>
                  {formatCurrency(cat.amount)}{' '}
                  <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {percent.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div
                  className={`h-full bg-${accentColor}-500 transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions list */}
      <div className="space-y-1.5">
        <h4 className={`text-xs font-semibold mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {t("Ro'yxat", language)} ({transactions.length})
        </h4>
        {transactions.length === 0 ? (
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {t("Tranzaksiyalar saqlanmagan (eski arxiv)", language)}
          </p>
        ) : (
          transactions.map((tx, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                isDarkMode ? 'bg-gray-800/50 border border-red-900/20' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {tx.description || tx.categoryName}
                </p>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {tx.categoryName}
                  {tx.apprenticeName && ` · ${tx.apprenticeName}`}
                  {tx.paymentMethod && ` · ${tx.paymentMethod === 'cash' ? t('Naqd', language) : t('Karta', language)}`}
                  {tx.createdAt &&
                    ` · ${new Date(tx.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}`}
                </p>
              </div>
              <div className={`font-bold text-${accentColor}-600 ml-2 whitespace-nowrap`}>
                {formatCurrency(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface StaffBreakdownProps {
  apprentices: any[];
  masters: any[];
  isDarkMode: boolean;
  language: 'latin' | 'cyrillic';
}

const StaffBreakdown: React.FC<StaffBreakdownProps> = ({ apprentices, masters, isDarkMode, language }) => {
  const renderStaffGroup = (list: any[], title: string) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{title}</h4>
        {list.map((u: any) => (
          <details
            key={u.userId}
            className={`rounded-lg overflow-hidden ${
              isDarkMode ? 'bg-gray-800/50 border border-red-900/20' : 'bg-gray-50'
            }`}
          >
            <summary className="flex items-center justify-between p-3 cursor-pointer">
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full w-9 h-9 flex items-center justify-center ${
                    isDarkMode ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-blue-100'
                  }`}
                >
                  <span className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
                    {u.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.name}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {u.taskCount || 0} {t('vazifa', language)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-green-600">{formatCurrency(u.earnings || 0)}</p>
            </summary>
            {u.tasks && u.tasks.length > 0 && (
              <div className={`px-3 pb-3 space-y-1 ${isDarkMode ? 'border-t border-red-900/20' : 'border-t border-gray-200'}`}>
                {u.tasks.map((task: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded text-xs ${
                      isDarkMode ? 'bg-gray-900/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {task.carLicensePlate || '—'}
                        {task.carOwnerName && ` · ${task.carOwnerName}`}
                      </p>
                    </div>
                    <div className="font-bold text-green-600 ml-2">
                      {formatCurrency(task.apprenticeEarning || task.payment || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    );
  };

  if (apprentices.length === 0 && masters.length === 0) {
    return (
      <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {t("Xodimlar ma'lumotlari yo'q", language)}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {renderStaffGroup(masters, t('Ustalar', language))}
      {renderStaffGroup(apprentices, t('Shogirdlar', language))}
    </div>
  );
};

interface TransactionsListProps {
  transactions: any[];
  isDarkMode: boolean;
  language: 'latin' | 'cyrillic';
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, isDarkMode, language }) => {
  if (transactions.length === 0) {
    return (
      <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {t("Tranzaksiyalar saqlanmagan (eski arxiv)", language)}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((tx, idx) => {
        const isIncome = tx.type === 'income';
        return (
          <div
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-800/50 border border-red-900/20' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isIncome ? (
                <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {tx.description || tx.categoryName || '—'}
                </p>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {tx.categoryName}
                  {tx.apprenticeName && ` · ${tx.apprenticeName}`}
                  {tx.createdByName && ` · ${tx.createdByName}`}
                  {tx.paymentMethod && ` · ${tx.paymentMethod === 'cash' ? t('Naqd', language) : t('Karta', language)}`}
                  {tx.createdAt &&
                    ` · ${new Date(tx.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            <div className={`font-bold ml-2 whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {isIncome ? '+' : '−'} {formatCurrency(tx.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthDetailModal;
