import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { 
  Award, 
  Clock,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

interface ApprovedTask {
  _id: string;
  title: string;
  car: {
    make: string;
    carModel: string;
    licensePlate: string;
    ownerName: string;
  };
  earning: number;
  totalPayment: number;
  percentage: number;
  approvedAt: string;
}

interface ApprenticeEarningsData {
  name: string;
  currentMonthEarnings: number;
  totalEarnings: number;
  approvedTasksCount: number;
  approvedTasksEarnings: number;
  approvedTasks: ApprovedTask[];
}

const ApprenticeAchievements: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all'>('all');
  const [earningsData, setEarningsData] = useState<ApprenticeEarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Backend'dan daromad ma'lumotlarini olish
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stats/apprentice/earnings');
        if (response.data.success) {
          setEarningsData(response.data.data);
        }
      } catch (error) {
        console.error('Daromad ma\'lumotlarini olishda xatolik:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Shogird uchun vazifalarni filtrlash
  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    // Eski tizim: assignedTo
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    if (assignedToId === user?.id) return true;
    
    // Yangi tizim: assignments array ichida tekshirish
    if (task.assignments && task.assignments.length > 0) {
      return task.assignments.some((assignment: any) => {
        const apprenticeId = typeof assignment.apprentice === 'object' 
          ? assignment.apprentice._id 
          : assignment.apprentice;
        return apprenticeId === user?.id;
      });
    }
    
    return false;
  });
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');

  // Vaqt bo'yicha filtrlash
  const getFilteredTasks = () => {
    if (!earningsData) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    return earningsData.approvedTasks.filter((task) => {
      if (!task.approvedAt) return false;
      const approvedDate = new Date(task.approvedAt);

      switch (timeFilter) {
        case 'today':
          return approvedDate >= today;
        case 'yesterday':
          return approvedDate >= yesterday && approvedDate < today;
        case 'week':
          return approvedDate >= weekAgo;
        case 'month':
          return approvedDate >= monthAgo;
        case 'year':
          return approvedDate >= yearAgo;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredTasks = getFilteredTasks();


  // Haftalik faoliyat
  const getWeeklyActivity = () => {
    const today = new Date();
    const weekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    
    // Oxirgi 7 kunni olish
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = weekDays[date.getDay()];
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Shu kunda bajarilgan vazifalarni topish
      const dayTasks = approvedTasks.filter((task: any) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });

      const hours = dayTasks.reduce((total: number, task: any) => total + (task.actualHours || 0), 0);
      const maxHours = 10; // Maksimal soat
      const percentage = maxHours > 0 ? Math.min((hours / maxHours) * 100, 100) : 0;

      return {
        day: dayName,
        hours: hours,
        percentage: percentage
      };
    });
  };

  const weeklyActivity = getWeeklyActivity();

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
            isDarkMode ? 'border-red-600' : 'border-blue-600'
          }`}></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('Yuklanmoqda...', language)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-6 p-2 sm:p-0 pb-20 min-h-screen ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gray-50'
    }`}>
      {/* Mobile-First Header */}
      <div className="text-center sm:text-left">
        <h1 className={`text-2xl sm:text-3xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('Mening daromadim', language)}</h1>
        <p className={`mt-1 sm:mt-2 text-sm sm:text-base ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {t('Sizning professional rivojlanishingiz va erishgan yutuqlaringiz.', language)}
        </p>
      </div>

      {/* Jami daromad kartasi */}
      <div className={`rounded-xl p-4 sm:p-6 text-white shadow-xl ${
        isDarkMode
          ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <p className={`text-sm sm:text-base mb-1 ${
                isDarkMode ? 'text-red-100' : 'text-blue-100'
              }`}>{t('Jami daromad', language)}</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {new Intl.NumberFormat('uz-UZ').format(earningsData?.currentMonthEarnings || 0)}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${
                isDarkMode ? 'text-red-100' : 'text-blue-100'
              }`}>{t('so\'m (joriy oy)', language)}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold">{earningsData?.approvedTasksCount || 0}</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-red-100' : 'text-blue-100'
            }`}>{t('ta vazifa', language)}</div>
          </div>
        </div>
      </div>

      {/* Mobile-First Daromad Section */}
      <div className={`rounded-xl p-3 sm:p-6 shadow-lg border ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-red-900/20 to-gray-800 border-red-900/30'
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h3 className={`text-base sm:text-lg font-semibold flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Award className={`h-5 w-5 sm:h-6 sm:w-6 ${
              isDarkMode ? 'text-red-400' : 'text-blue-600'
            }`} />
            {t('Daromad tarixi', language)}
          </h3>
          
          {/* Time Filter Select */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className={`px-3 sm:px-4 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent font-medium text-sm w-full sm:w-auto ${
              isDarkMode
                ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500'
                : 'bg-white border-blue-200 text-gray-700 focus:ring-blue-500'
            }`}
          >
            <option value="yesterday">{t('Kecha', language)}</option>
            <option value="today">{t('Bugun', language)}</option>
            <option value="week">{t('1 hafta', language)}</option>
            <option value="month">{t('1 oy', language)}</option>
            <option value="year">{t('1 yil', language)}</option>
            <option value="all">{t('Hammasi', language)}</option>
          </select>
        </div>



        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Award className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {timeFilter === 'today' ? t('Bugun daromad yo\'q', language) :
               timeFilter === 'yesterday' ? t('Kecha daromad yo\'q', language) :
               timeFilter === 'week' ? t('Bu haftada daromad yo\'q', language) :
               timeFilter === 'month' ? t('Bu oyda daromad yo\'q', language) :
               timeFilter === 'year' ? t('Bu yilda daromad yo\'q', language) :
               t('Hali daromad yo\'q', language)}
            </p>
            <p className={`text-sm mt-2 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>{t('Vazifalarni bajaring va daromad oling!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => {
                // Agar daromad bo'lmasa, ko'rsatmaymiz
                if (task.earning === 0) return null;
                
                return (
                  <div key={task._id} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:shadow-md transition-shadow gap-3 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-900/30 to-gray-800 border-red-900/30'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-white font-bold text-sm sm:text-lg flex-shrink-0 ${
                        isDarkMode
                          ? 'bg-red-600'
                          : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm sm:text-base truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{task.title}</h4>
                        <p className={`text-xs sm:text-sm truncate ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.car?.make} {task.car?.carModel} - {task.car?.licensePlate}
                        </p>
                        <p className={`text-xs mt-1 truncate ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sana noma\'lum'}
                        </p>
                        {task.percentage && task.totalPayment > 0 && (
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-blue-600'
                          }`}>
                            {t('Umumiy:', language)} {new Intl.NumberFormat('uz-UZ').format(task.totalPayment)} • {task.percentage}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg sm:text-2xl font-bold ${
                        isDarkMode ? 'text-red-400' : 'text-blue-600'
                      }`}>
                        +{new Intl.NumberFormat('uz-UZ').format(task.earning)}
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-red-500' : 'text-blue-700'
                      }`}>so'm</p>
                      {task.percentage && (
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>({task.percentage}%)</p>
                      )}
                    </div>
                  </div>
                );
              })}
            
            {filteredTasks.every((task) => task.earning === 0) && (
              <div className="text-center py-8">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{t('To\'lovli vazifalar yo\'q', language)}</p>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Progress Chart */}
      <div className={`rounded-xl p-3 sm:p-6 shadow-lg border ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-red-900/20 to-gray-800 border-red-900/30'
          : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('Haftalik faoliyat', language)}</h3>
        {weeklyActivity.every(day => day.hours === 0) ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm sm:text-base ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{t('Hali haftalik faoliyat yo\'q', language)}</p>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>{t('Vazifalarni bajarib, statistikangizni ko\'ring!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {weeklyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between gap-2 sm:gap-4">
                <span className={`text-xs sm:text-sm w-16 sm:w-24 flex-shrink-0 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{day.day}</span>
                <div className={`flex-1 rounded-full h-2 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isDarkMode ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${day.percentage}%` }}
                  ></div>
                </div>
                <span className={`text-xs sm:text-sm w-12 sm:w-16 text-right flex-shrink-0 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {day.hours > 0 ? `${day.hours.toFixed(1)} ${t('soat', language)}` : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprenticeAchievements;