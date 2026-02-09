import React from 'react';
import { Wallet, CreditCard, Smartphone, TrendingUp, TrendingDown } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';

interface UserCashierCardProps {
  user: {
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
  };
  isCurrentUser: boolean;
  language: 'latin' | 'cyrillic';
}

const UserCashierCard: React.FC<UserCashierCardProps> = ({ user, isCurrentUser, language }) => {
  const balance = user.income.total - user.expense.total;
  
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-xl
      ${isCurrentUser 
        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {user.userName}
          </h3>
          {isCurrentUser && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
              {t('Siz', language)}
            </span>
          )}
        </div>
        <div className={`text-2xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(balance, language)}
        </div>
      </div>
      
      {/* KIRIM */}
      <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-green-700">{t('Kirim', language)}</span>
          </div>
          <span className="text-lg font-bold text-green-900">
            {formatCurrency(user.income.total, language)}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-green-600" />
              <span className="text-gray-700">{t('Naqd', language)}:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.income.cash, language)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-green-600" />
              <span className="text-gray-700">{t('Karta', language)}:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.income.card, language)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-green-600" />
              <span className="text-gray-700">Click:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.income.click, language)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-green-200">
            <span className="text-xs text-gray-600">{t('Transaksiyalar', language)}:</span>
            <span className="text-xs font-semibold text-gray-900">{user.income.count} {t('ta', language)}</span>
          </div>
        </div>
      </div>
      
      {/* CHIQIM */}
      <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500 rounded-lg">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-red-700">{t('Chiqim', language)}</span>
          </div>
          <span className="text-lg font-bold text-red-900">
            {formatCurrency(user.expense.total, language)}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-red-600" />
              <span className="text-gray-700">{t('Naqd', language)}:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.expense.cash, language)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-red-600" />
              <span className="text-gray-700">{t('Karta', language)}:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.expense.card, language)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-red-600" />
              <span className="text-gray-700">Click:</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(user.expense.click, language)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-red-200">
            <span className="text-xs text-gray-600">{t('Transaksiyalar', language)}:</span>
            <span className="text-xs font-semibold text-gray-900">{user.expense.count} {t('ta', language)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCashierCard;
