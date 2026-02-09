import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';

interface TotalStatsCardProps {
  type: 'income' | 'expense' | 'balance';
  total: number;
  cash: number;
  card: number;
  count?: number;
  byUser?: Array<{
    userId: string;
    userName: string;
    amount: number;
  }>;
  language: 'latin' | 'cyrillic';
}

const TotalStatsCard: React.FC<TotalStatsCardProps> = ({
  type,
  total,
  cash,
  card,
  count,
  byUser,
  language
}) => {
  const config = {
    income: {
      icon: TrendingUp,
      label: t('Kirim', language),
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-500',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-700',
      textColor: 'text-green-600',
      boldText: 'text-green-900',
      userBg: 'bg-white/60'
    },
    expense: {
      icon: TrendingDown,
      label: t('Chiqim', language),
      bgColor: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-500',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      textColor: 'text-red-600',
      boldText: 'text-red-900',
      userBg: 'bg-white/60'
    },
    balance: {
      icon: BarChart3,
      label: t('Balans', language),
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-500',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      textColor: 'text-blue-600',
      boldText: total >= 0 ? 'text-green-900' : 'text-red-900',
      userBg: 'bg-white/60'
    }
  };

  const cfg = config[type];
  const Icon = cfg.icon;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${cfg.bgColor} rounded-xl p-4 border ${cfg.borderColor} hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${cfg.iconBg} rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className={`text-xs font-semibold ${cfg.badgeText} ${cfg.badgeBg} px-2 py-1 rounded-full`}>
          {cfg.label}
        </span>
      </div>
      
      <div className="mb-3">
        <p className={`text-xs ${cfg.textColor} mb-1`}>{t('Umumiy', language)}</p>
        <div className={`text-2xl font-bold ${cfg.boldText}`}>
          {formatCurrency(total, language)}
        </div>
      </div>
      
      {/* USER BO'YICHA */}
      {byUser && byUser.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {byUser.map((user) => (
            <div key={user.userId} className={`flex items-center justify-between ${cfg.userBg} rounded-lg p-2`}>
              <span className={`text-xs ${cfg.textColor} font-medium`}>
                {user.userName}:
              </span>
              <span className={`text-xs font-bold ${cfg.boldText}`}>
                {formatCurrency(user.amount, language)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className={`${cfg.userBg} rounded-lg p-2`}>
          <p className={`text-xs ${cfg.textColor} mb-0.5`}>{t('Naqd', language)}</p>
          <div className={`text-sm font-bold ${cfg.boldText}`}>
            {formatCurrency(cash, language)}
          </div>
        </div>
        
        <div className={`${cfg.userBg} rounded-lg p-2`}>
          <p className={`text-xs ${cfg.textColor} mb-0.5`}>{t('Karta', language)}</p>
          <div className={`text-sm font-bold ${cfg.boldText}`}>
            {formatCurrency(card, language)}
          </div>
        </div>
      </div>
      
      {count !== undefined && (
        <p className={`text-xs ${cfg.textColor}`}>
          {count} {t('ta', language)}
        </p>
      )}
      
      {type === 'balance' && (
        <p className={`text-xs ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {total >= 0 ? t('Ijobiy', language) : t('Salbiy', language)}
        </p>
      )}
    </div>
  );
};

export default TotalStatsCard;
