import React, { useState, useEffect } from 'react';
import { X, DollarSign, Phone, Car } from 'lucide-react';
import { User as UserType, Car as CarType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';
import ViewCarModal from './ViewCarModal';

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
  car?: {
    _id: string;
    make: string;
    carModel: string;
    licensePlate: string;
  };
}

const ViewApprenticeModal: React.FC<ViewApprenticeModalProps> = ({ isOpen, onClose, apprentice }) => {
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks'>('stats');
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);

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

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative rounded-xl shadow-2xl max-w-lg w-full mx-2 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-white'
        }`}>
          {/* Compact Header */}
          <div className={`relative rounded-t-xl px-4 py-3 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
              : 'bg-gradient-to-r from-orange-600 to-orange-500'
          }`}>
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
          <div className={`flex border-b px-4 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? isDarkMode
                    ? 'border-red-500 text-red-400'
                    : 'border-orange-500 text-orange-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Ma\'lumotlar', language)}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? isDarkMode
                    ? 'border-red-500 text-red-400'
                    : 'border-orange-500 text-orange-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
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
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                      <Phone className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('Telefon', language)}
                      </div>
                      <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {formatPhoneNumber(apprentice.phone)}
                      </div>
                    </div>
                  </div>
                )}

                {/* To'lov turi */}
                <div className="space-y-2">
                  {apprentice.paymentType === 'daily' && apprentice.dailyRate ? (
                    <div className={`rounded-lg p-3 border ${
                      isDarkMode
                        ? 'bg-amber-900/30 border-amber-800'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${
                          isDarkMode ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          {t('Kunlik ish haqi:', language)}
                        </span>
                        <span className={`text-lg font-bold ${
                          isDarkMode ? 'text-amber-300' : 'text-amber-900'
                        }`}>
                          {formatCurrency(apprentice.dailyRate)}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-1 ${
                        isDarkMode ? 'text-amber-500' : 'text-amber-600'
                      }`}>
                        ✓ {t('Har kuni avtomatik to\'lov', language)}
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-lg p-3 border ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-800'
                        : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-xs mb-1 ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            {t('Foiz ulushi', language)}
                          </div>
                          <div className={`text-2xl font-bold ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-900'
                          }`}>
                            {apprentice.percentage || 0}%
                          </div>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg font-bold ${
                          isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                        }`}>
                          %
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daromad */}
                <div className={`rounded-lg p-3 border ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-800'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${
                      isDarkMode ? 'bg-green-600' : 'bg-green-500'
                    }`}>
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <span className={`text-xs font-semibold ${
                      isDarkMode ? 'text-green-300' : 'text-green-900'
                    }`}>
                      {t('Daromad', language)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-lg p-2 border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-green-200'
                    }`}>
                      <div className={`text-[10px] mb-0.5 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {t('Joriy oylik', language)}
                      </div>
                      <div className={`text-sm font-bold ${
                        isDarkMode ? 'text-green-300' : 'text-green-900'
                      }`}>
                        {formatCurrency(apprentice.earnings || 0)}
                      </div>
                    </div>
                    <div className={`rounded-lg p-2 border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-green-200'
                    }`}>
                      <div className={`text-[10px] mb-0.5 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {t('Jami', language)}
                      </div>
                      <div className={`text-sm font-bold ${
                        isDarkMode ? 'text-green-300' : 'text-green-900'
                      }`}>
                        {formatCurrency((apprentice.totalEarnings || 0) + (apprentice.earnings || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isLoadingTasks ? (
                  <div className="text-center py-6">
                    <div className={`animate-spin rounded-full h-6 w-6 border-2 border-t-transparent mx-auto ${
                      isDarkMode ? 'border-red-500' : 'border-orange-500'
                    }`} />
                    <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('Yuklanmoqda...', language)}
                    </p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t("Vazifalar yo'q", language)}
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => task.car && setSelectedCar(task.car as unknown as CarType)}
                      className={`rounded-lg p-3 transition-colors border ${
                        task.car ? 'cursor-pointer' : ''
                      } ${
                        isDarkMode
                          ? 'bg-gray-800 hover:bg-gray-750 border-gray-700'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <h4 className={`font-medium text-sm mb-1 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h4>
                      <p className={`text-xs mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {task.description}
                      </p>
                      {task.car && (
                        <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md ${
                          isDarkMode
                            ? 'bg-gray-700/60 text-gray-300'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          <Car className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {task.car.make} {task.car.carModel} — {task.car.licensePlate}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(task.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                        {task.payment > 0 && (
                          <span className="text-xs font-semibold text-green-600">
                            {formatCurrency(task.payment)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t px-4 py-2 rounded-b-xl ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={onClose}
              className={`w-full px-3 py-2 font-medium rounded-lg transition-colors text-xs ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {t('Yopish', language)}
            </button>
          </div>
        </div>
      </div>
      {selectedCar && (
        <ViewCarModal
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          car={selectedCar}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
};

export default ViewApprenticeModal;
