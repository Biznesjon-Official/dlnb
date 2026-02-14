import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { Clock, CheckCircle, Award, Target, Zap, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

const ApprenticeDashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { data: tasks } = useTasks();

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    return assignedToId === user?.id;
  });

  const todayTasks = myTasks.filter((task: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const inProgressTasks = myTasks.filter((task: any) => task.status === 'in-progress');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed');
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');

  const totalEarnings = user?.earnings || 0;
  const completionRate = myTasks.length > 0 ? Math.round(((completedTasks.length + approvedTasks.length) / myTasks.length) * 100) : 0;
  const totalApprovedEarnings = approvedTasks.reduce((sum: number, task: any) => sum + (task.payment || 0), 0);
  const totalWorkHours = inProgressTasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Xayrli tong", language);
    if (hour < 18) return t("Xayrli kun", language);
    return t("Xayrli kech", language);
  };

  return (
    <div className={isDarkMode ? 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'min-h-screen bg-gray-50'}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className={isDarkMode ? 'rounded-2xl p-8 text-white shadow-lg mb-6 bg-gradient-to-r from-red-600 via-red-700 to-gray-900' : 'rounded-2xl p-8 text-white shadow-lg mb-6 bg-gradient-to-r from-blue-600 to-indigo-600'}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{getGreeting()}, {user?.name || t("Shogirt", language)}!</h1>
              <p className={isDarkMode ? 'text-lg text-red-100' : 'text-lg text-blue-100'}>{t("Bugun ham ajoyib natijalar ko'rsatasiz deb umid qilamiz", language)}</p>
            </div>
            <div className="text-right">
              <p className={isDarkMode ? 'text-sm mb-1 text-red-100' : 'text-sm mb-1 text-blue-100'}>{t("Sizning foizingiz", language)}</p>
              <p className="text-4xl font-bold">{user?.percentage || 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={isDarkMode ? 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' : 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-white border-gray-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-900/60' : 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100'}>
                <Target className={isDarkMode ? 'h-6 w-6 text-red-400' : 'h-6 w-6 text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={isDarkMode ? 'text-sm mb-1 text-gray-400' : 'text-sm mb-1 text-gray-600'}>{t("Bugungi vazifalar", language)}</p>
                <p className={isDarkMode ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>{todayTasks.length}</p>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' : 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-white border-gray-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-yellow-900/60' : 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100'}>
                <Zap className={isDarkMode ? 'h-6 w-6 text-yellow-400' : 'h-6 w-6 text-amber-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={isDarkMode ? 'text-sm mb-1 text-gray-400' : 'text-sm mb-1 text-gray-600'}>{t("Jarayonda", language)}</p>
                <p className={isDarkMode ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>{inProgressTasks.length}</p>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' : 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-white border-gray-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-900/60' : 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-100'}>
                <CheckCircle className={isDarkMode ? 'h-6 w-6 text-green-400' : 'h-6 w-6 text-green-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={isDarkMode ? 'text-sm mb-1 text-gray-400' : 'text-sm mb-1 text-gray-600'}>{t("Bajarilgan", language)}</p>
                <p className={isDarkMode ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>{completedTasks.length}</p>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' : 'rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow bg-white border-gray-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-900/60' : 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-100'}>
                <Sparkles className={isDarkMode ? 'h-6 w-6 text-purple-400' : 'h-6 w-6 text-purple-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={isDarkMode ? 'text-sm mb-1 text-gray-400' : 'text-sm mb-1 text-gray-600'}>{t("Tasdiqlangan", language)}</p>
                <p className={isDarkMode ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>{approvedTasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={isDarkMode ? 'rounded-2xl p-6 border bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-700' : 'rounded-2xl p-6 border bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-purple-600' : 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-purple-500'}>
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className={isDarkMode ? 'text-sm font-medium mb-1 text-purple-300' : 'text-sm font-medium mb-1 text-purple-700'}>{t("Bajarish foizi", language)}</p>
                <p className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>{completionRate}%</p>
                <p className={isDarkMode ? 'text-sm mt-1 text-purple-400' : 'text-sm mt-1 text-purple-600'}>{t("Jami vazifalardan", language)}</p>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 border bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-indigo-700' : 'rounded-2xl p-6 border bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-indigo-600' : 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-indigo-500'}>
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className={isDarkMode ? 'text-sm font-medium mb-1 text-indigo-300' : 'text-sm font-medium mb-1 text-indigo-700'}>{t("Ish soatlari", language)}</p>
                <p className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>{totalWorkHours}</p>
                <p className={isDarkMode ? 'text-sm mt-1 text-indigo-400' : 'text-sm mt-1 text-indigo-600'}>{t("soat (jarayonda)", language)}</p>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 border bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' : 'rounded-2xl p-6 border bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-red-600' : 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gray-700'}>
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className={isDarkMode ? 'text-sm font-medium mb-1 text-gray-300' : 'text-sm font-medium mb-1 text-gray-700'}>{t("Jami vazifalar", language)}</p>
                <p className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>{myTasks.length}</p>
                <p className={isDarkMode ? 'text-sm mt-1 text-gray-400' : 'text-sm mt-1 text-gray-600'}>{t("ta vazifa", language)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={isDarkMode ? 'rounded-2xl p-8 text-white shadow-xl bg-gradient-to-r from-red-600 via-red-700 to-pink-700' : 'rounded-2xl p-8 text-white shadow-xl bg-gradient-to-r from-blue-500 to-indigo-600'}>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Award className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className={isDarkMode ? 'text-lg font-medium mb-2 text-red-100' : 'text-lg font-medium mb-2 text-blue-100'}>{t("Joriy oylik daromad", language)}</p>
                <p className="text-5xl font-bold">{new Intl.NumberFormat('uz-UZ').format(totalEarnings)}</p>
                <p className={isDarkMode ? 'mt-1 text-red-100' : 'mt-1 text-blue-100'}>{t("so'm", language)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className={isDarkMode ? 'text-sm mb-1 text-red-100' : 'text-sm mb-1 text-blue-100'}>{t("Tasdiqlangan", language)}</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat('uz-UZ').format(totalApprovedEarnings)}</p>
                <p className={isDarkMode ? 'text-xs text-red-100' : 'text-xs text-blue-100'}>{t("so'm (barcha vaqt)", language)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={isDarkMode ? 'rounded-2xl p-6 border bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-700' : 'rounded-2xl p-6 border bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-green-600' : 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-green-500'}>
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className={isDarkMode ? 'text-sm font-medium mb-1 text-green-300' : 'text-sm font-medium mb-1 text-green-700'}>{t("Oylik maqsad", language)}</p>
                <p className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>{completedTasks.length + approvedTasks.length}</p>
                <p className={isDarkMode ? 'text-sm mt-1 text-green-400' : 'text-sm mt-1 text-green-600'}>{t("ta vazifa bajarildi", language)}</p>
              </div>
            </div>
            <div className={isDarkMode ? 'mt-4 pt-4 border-t border-green-800' : 'mt-4 pt-4 border-t border-green-200'}>
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t("Bajarish foizi", language)}</span>
                <span className={isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>{completionRate}%</span>
              </div>
              <div className={isDarkMode ? 'mt-2 w-full rounded-full h-2 bg-green-900' : 'mt-2 w-full rounded-full h-2 bg-green-200'}>
                <div className={isDarkMode ? 'h-2 rounded-full transition-all duration-500 bg-green-500' : 'h-2 rounded-full transition-all duration-500 bg-green-500'} style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className={isDarkMode ? 'rounded-2xl p-6 border bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700' : 'rounded-2xl p-6 border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}>
            <div className="flex items-center gap-4">
              <div className={isDarkMode ? 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-blue-600' : 'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-blue-600'}>
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className={isDarkMode ? 'text-sm font-medium mb-1 text-blue-300' : 'text-sm font-medium mb-1 text-blue-700'}>{t("Ish faoliyati", language)}</p>
                <p className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>{inProgressTasks.length}</p>
                <p className={isDarkMode ? 'text-sm mt-1 text-blue-400' : 'text-sm mt-1 text-blue-600'}>{t("ta vazifa jarayonda", language)}</p>
              </div>
            </div>
            <div className={isDarkMode ? 'mt-4 pt-4 border-t border-blue-800' : 'mt-4 pt-4 border-t border-blue-200'}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t("Bugungi vazifalar", language)}</span>
                <span className={isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>{todayTasks.length} ta</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t("Jami soatlar", language)}</span>
                <span className={isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>{totalWorkHours} soat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprenticeDashboard;
