import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Car, 
  CreditCard, 
  LogOut,
  User,
  Users,
  Award,
  Globe,
  BookOpen,
  X,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useLowStockCount } from '@/hooks/useSpareParts';
import { useCompletedTasksCount } from '@/hooks/useTasks';
import { useOverdueDebtsCount } from '@/hooks/useDebts';
import { useBackendStatus } from '@/hooks/useBackendStatus';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDarkMode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Only fetch counts for master users
  const isMaster = user?.role === 'master';
  const { isOnline: backendOnline } = useBackendStatus();
  const { data: lowStockCount = 0 } = useLowStockCount();
  const { data: completedTasksCount = 0 } = useCompletedTasksCount();
  const { data: overdueDebtsCount = 0 } = useOverdueDebtsCount(isMaster); // Faqat master uchun

  // localStorage'dan tilni o'qish va o'zgartirish
  const [language, setLanguage] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  // Tilni almashtirish funksiyasi
  const toggleLanguage = () => {
    const newLanguage = language === 'latin' ? 'cyrillic' : 'latin';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Sahifani yangilash
    window.location.reload();
  };

  // Rol asosida navigatsiya menyusini aniqlash
  const getMasterNavigation = () => {
    // Offline bo'lsa faqat avtomobillar sahifasi
    if (!backendOnline) {
      return [
        { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      ];
    }
    
    // Online bo'lsa barcha sahifalar
    return [
      { name: t('Kassa', language), href: '/app/master/cashier', icon: CreditCard },
      { name: t('Mijozlar', language), href: '/app/master/customers', icon: Users },
      { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      { name: t('Shogirdlar', language), href: '/app/master/apprentices', icon: Users },
      { name: t('Qarz daftarchasi', language), href: '/app/debts', icon: BookOpen },
    ];
  };

  const getApprenticeNavigation = () => {
    // Offline bo'lsa faqat avtomobillar sahifasi
    if (!backendOnline) {
      return [
        { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      ];
    }
    
    // Online bo'lsa barcha sahifalar
    return [
      { name: t('Shogird paneli', language), href: '/app/dashboard', icon: LayoutDashboard },
      { name: t('Mening vazifalarim', language), href: '/app/apprentice/tasks', icon: CheckSquare },
      { name: t('Mening daromadim', language), href: '/app/apprentice/achievements', icon: Award },
    ];
  };

  const navigation = user?.role === 'master' ? getMasterNavigation() : getApprenticeNavigation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getRoleGradient = () => {
    return user?.role === 'master' 
      ? 'from-red-600 via-red-700 to-gray-900' 
      : 'from-red-600 via-red-700 to-gray-900';
  };

  const getActiveGradient = () => {
    return user?.role === 'master'
      ? 'from-red-600 via-red-700 to-gray-900'
      : 'from-red-600 via-red-700 to-gray-900';
  };

  // Escape key ni eshitish
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Body scroll ni bloklash
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-[101] w-80 shadow-2xl transform transition-all duration-300 ease-out lg:hidden border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDarkMode 
            ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-red-900/20' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* User Info - Header */}
          <div className={`border-b p-4 transition-colors duration-300 ${
            isDarkMode
              ? 'border-red-900/30 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800'
              : 'border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} shadow-lg ${isDarkMode ? 'shadow-red-500/30' : 'shadow-red-500/20'} flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
                  {user?.role === 'master' ? (
                    <Users className="h-6 w-6 text-white relative z-10 drop-shadow-lg" />
                  ) : (
                    <User className="h-6 w-6 text-white relative z-10 drop-shadow-lg" />
                  )}
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 shadow-lg animate-pulse ${isDarkMode ? 'border-2 border-gray-900' : 'border-2 border-white'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate drop-shadow-md ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                  <p className={`text-xs font-semibold ${user?.role === 'master' ? 'text-red-600' : 'text-red-600'}`}>
                    {user?.role === 'master' ? t('Admin', language) : t('Shogird', language)}
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className={`p-2 rounded-lg backdrop-blur-sm transition-colors border ${
                  isDarkMode
                    ? 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 space-y-1 p-4 overflow-y-auto transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
              : 'bg-white'
          }`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isSparePartsPage = item.href === '/app/master/spare-parts';
              const isTasksPage = item.href === '/app/master/tasks';
              const isDebtsPage = item.href === '/app/debts';
              const showSparePartsBadge = isSparePartsPage && lowStockCount > 0;
              const showTasksBadge = user?.role === 'master' && isTasksPage && completedTasksCount > 0;
              const showDebtsBadge = user?.role === 'master' && isDebtsPage && overdueDebtsCount > 0;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? isDarkMode
                        ? `bg-gradient-to-r ${getActiveGradient()} text-white shadow-lg shadow-red-500/50 border border-red-500/30`
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-gray-800/50 hover:text-white hover:border hover:border-red-900/30'
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  {active && (
                    <>
                      <div className={`absolute inset-0 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-white/10 to-transparent' : 'bg-gradient-to-r from-white/20 to-transparent'}`}></div>
                      {isDarkMode && <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent rounded-xl"></div>}
                    </>
                  )}
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 relative z-10 mr-3 ${
                      active
                        ? 'text-white drop-shadow-lg'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }`}
                  />
                  <span className="relative z-10 truncate">{item.name}</span>
                  {showSparePartsBadge && (
                    <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse shadow-lg shadow-red-500/50">
                      {lowStockCount}
                    </div>
                  )}
                  {showTasksBadge && (
                    <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-green-500 text-white text-xs font-bold animate-pulse shadow-lg shadow-green-500/50">
                      {completedTasksCount}
                    </div>
                  )}
                  {showDebtsBadge && (
                    <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse shadow-lg shadow-red-600/50">
                      {overdueDebtsCount}
                    </div>
                  )}
                  {active && !showSparePartsBadge && !showTasksBadge && !showDebtsBadge && (
                    <div className="ml-auto relative z-10">
                      <div className={`h-2 w-2 rounded-full animate-pulse shadow-lg ${isDarkMode ? 'bg-red-400 shadow-red-400/50' : 'bg-white shadow-white/50'}`}></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className={`border-t p-4 space-y-2 transition-colors duration-300 ${
            isDarkMode
              ? 'border-red-900/30 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800'
              : 'border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50'
          }`}>
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-900/40 hover:to-gray-800/60 hover:text-white hover:shadow-md hover:border hover:border-red-900/30'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <Globe className={`h-5 w-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <span>{language === 'latin' ? 'Кирил' : 'Lotin'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-800 hover:text-white hover:shadow-lg hover:shadow-red-500/50 hover:border hover:border-red-500/30'
                  : 'text-gray-700 hover:bg-red-600 hover:text-white hover:shadow-lg'
              }`}
            >
              <LogOut className={`h-5 w-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <span>{t("Chiqish", language)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;