import React, { useState, useEffect } from 'react';
import { X, DollarSign, Phone } from 'lucide-react';
import { User as UserType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface ViewApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  payment: number;
  createdAt: string;
}

const ViewApprenticeModal: React.FC<ViewApprenticeModalProps> = ({ isOpen, onClose, apprentice }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks'>('stats');

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && apprentice) {
      fetchApprenticeTasks();
    }
  }, [isOpen, apprentice]);

  const fetchApprenticeTasks = async () => {
    if (!apprentice) return;
    
    setIsLoadingTasks(true);
    try {
      const response = await api.get(`/tasks?assignedTo=${apprentice._id}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  if (!isOpen || !apprentice) return null;

  const getPerformanceGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-indigo-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-2">
          {/* Compact Header */}
          <div className={`relative bg-gradient-to-r ${getPerformanceGradient(50)} px-4 py-3 rounded-t-xl`}>
            <button 
              onClick={onClose} 
              className="absolute top-2 right-2 z-10 text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3 pr-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white font-bold text-base border border-white/40">
                {t(apprentice.name, language).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white truncate">{t(apprentice.name, language)}</h2>
                <p className="text-white/80 text-xs">@{apprentice.username}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Ma\'lumotlar', language)}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Vazifalar', language)} ({tasks.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {activeTab === 'stats' ? (
              <div className="space-y-3">
                {/* Telefon */}
                {apprentice.phone && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                      <Phone className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-500">{t('Telefon', language)}</div>
                      <div className="text-xs font-medium text-gray-900">{formatPhoneNumber(apprentice.phone)}</div>
                    </div>
                  </div>
                )}

                {/* To'lov turi */}
                <div className="space-y-2">
                  {apprentice.paymentType === 'daily' && apprentice.dailyRate ? (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-700 font-medium">{t('Kunlik ish haqi:', language)}</span>
                        <span className="text-lg font-bold text-amber-900">{formatCurrency(apprentice.dailyRate)}</span>
                      </div>
                      <div className="text-[10px] text-amber-600 mt-1">
                        ✓ {t('Har kuni avtomatik to\'lov', language)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-purple-600 mb-1">{t('Foiz ulushi', language)}</div>
                          <div className="text-2xl font-bold text-purple-900">{apprentice.percentage || 0}%</div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white text-lg font-bold">
                          %
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daromad */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-500 p-1.5 rounded-lg">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-900">{t('Daromad', language)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <div className="text-[10px] text-green-600 mb-0.5">{t('Joriy oylik', language)}</div>
                      <div className="text-sm font-bold text-green-900">{formatCurrency(apprentice.earnings || 0)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <div className="text-[10px] text-green-600 mb-0.5">{t('Jami', language)}</div>
                      <div className="text-sm font-bold text-green-900">{formatCurrency(apprentice.totalEarnings || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isLoadingTasks ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto" />
                    <p className="mt-2 text-xs text-gray-600">{t('Yuklanmoqda...', language)}</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-500">{t("Vazifalar yo'q", language)}</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task._id} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h4>
                      <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleDateString('uz-UZ')}</span>
                        {task.payment > 0 && (
                          <span className="text-xs font-semibold text-green-600">{formatCurrency(task.payment)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 rounded-b-xl bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-xs"
            >
              {t('Yopish', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewApprenticeModal;
