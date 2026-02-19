import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Moon,
  Sun,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import Sidebar from './Sidebar';
import BottomNavbar from './BottomNavbar';
import { OfflineIndicator } from './OfflineIndicator';
import { OfflineTransitionModal } from './OfflineTransitionModal';
import { useLowStockCount } from '@/hooks/useSpareParts';
import { useCompletedTasksCount } from '@/hooks/useTasks';
import { useOverdueDebtsCount } from '@/hooks/useDebts';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Fetch counts for master users
  const isMaster = user?.role === 'master';
  const isOnline = navigator.onLine;
  const { isOnline: backendOnline } = useBackendStatus();
  
  // Faqat online bo'lganda va master bo'lganda count hooklar ishlatiladi
  const { data: lowStockCount = 0 } = useLowStockCount();
  const { data: completedTasksCount = 0 } = useCompletedTasksCount();
  const { data: overdueDebtsCount = 0 } = useOverdueDebtsCount(isMaster && isOnline);

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
    window.location.reload();
  };

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
    // Aniq path matching
    return location.pathname === path;
  };

  // Warehouse sahifasida sidebar ko'rinmasligi kerak
  const isWarehousePage = location.pathname === '/app/master/warehouse';
  // Kassa va Debts sahifalarida to'liq kenglik kerak (sidebar bilan)
  const isCashierPage = location.pathname === '/app/master/cashier';
  const isDebtsPage = location.pathname === '/app/debts';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Offline Transition Modal - Professional UI */}
      <OfflineTransitionModal />
      
      {/* Mobile Header */}
      {isMobile && !isWarehousePage && (
        <div className={`fixed top-0 left-0 right-0 z-[60] backdrop-blur-lg shadow-lg border-b transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-900/95 border-red-900/30'
            : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Site Name */}
            <div className="flex items-center gap-2">
              <div>
                <span className={`block text-base font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Dalnoboy Shop</span>
                <span className={`block text-[9px] font-medium -mt-0.5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Professional Service</span>
              </div>
            </div>

            {/* Language Toggle & Dark Mode & Logout Buttons */}
            <div className="flex items-center space-x-2">
              {/* Dark/Light Mode Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
                    : 'bg-gradient-to-r from-gray-200 to-gray-300'
                }`}
                title={isDarkMode ? t('Yorug\' rejim', language) : t('Qorong\'i rejim', language)}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700 group-hover:-rotate-12 transition-transform duration-200" />
                )}
              </button>

              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className={`p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
                    : 'bg-gradient-to-r from-red-500 to-red-700'
                } text-white`}
                title={language === 'latin' ? 'Кирил' : 'Lotin'}
              >
                <Globe className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className={`p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800'
                    : 'bg-gradient-to-r from-black to-gray-800'
                } text-white`}
                title={t("Chiqish", language)}
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Mobile */}
      {!isWarehousePage && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isDarkMode={isDarkMode} />}

      {/* Sidebar - faqat desktop uchun */}
      {!isMobile && !isWarehousePage && (
        <div 
          className={`fixed inset-y-0 left-0 z-50 shadow-2xl w-72 border-r transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-red-900/20' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex h-full flex-col">
          {/* User Info */}
          <div className={`border-b p-4 animate-fadeIn transition-colors duration-300 ${
            isDarkMode
              ? 'border-red-900/30 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800'
              : 'border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50'
          }`}>
              <div className="flex items-center">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} shadow-lg ${isDarkMode ? 'shadow-red-500/30' : 'shadow-red-500/20'} flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
                  {user?.role === 'master' ? (
                    <Users className="h-6 w-6 text-white relative z-10 drop-shadow-lg" />
                  ) : (
                    <User className="h-6 w-6 text-white relative z-10 drop-shadow-lg" />
                  )}
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 shadow-lg animate-pulse ${isDarkMode ? 'border-2 border-gray-900' : 'border-2 border-white'}`}></div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate drop-shadow-md ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                  <p className={`text-xs font-semibold ${user?.role === 'master' ? 'text-red-600' : 'text-red-600'}`}>
                    {user?.role === 'master' ? t('Admin', language) : t('Shogird', language)}
                  </p>
                </div>
              </div>
            </div>
          
          {/* Navigation */}
          <nav className={`flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
              : 'bg-white'
          }`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
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
                <div key={item.name} className="relative group/item">
                  <Link
                    to={item.href}
                    className={`relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      active
                        ? isDarkMode
                          ? `bg-gradient-to-r ${getActiveGradient()} text-white shadow-lg shadow-red-500/50 transform scale-[1.02] border border-red-500/30`
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 transform scale-[1.02]'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-gray-800/50 hover:text-white hover:scale-[1.01] hover:shadow-md hover:border hover:border-red-900/30'
                          : 'text-gray-700 hover:bg-red-50 hover:text-red-700 hover:scale-[1.01]'
                    }`}
                  >
                    {active && (
                      <>
                        <div className={`absolute inset-0 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-white/10 to-transparent' : 'bg-gradient-to-r from-white/20 to-transparent'}`}></div>
                        {isDarkMode && <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent rounded-xl"></div>}
                      </>
                    )}
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                        active
                          ? 'text-white drop-shadow-lg'
                          : isDarkMode
                            ? 'text-gray-400 group-hover/item:text-red-400'
                            : 'text-gray-500 group-hover/item:text-red-600'
                      } mr-3`}
                    />
                    <span className="relative z-10 truncate animate-fadeIn">{item.name}</span>
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
                      <div className="ml-auto relative z-10 animate-fadeIn">
                        <div className={`h-2 w-2 rounded-full animate-pulse shadow-lg ${isDarkMode ? 'bg-red-400 shadow-red-400/50' : 'bg-white shadow-white/50'}`}></div>
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Language Toggle & Logout */}
          <div className={`border-t p-3 space-y-1.5 transition-colors duration-300 ${
            isDarkMode
              ? 'border-red-900/30 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800'
              : 'border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50'
          }`}>
            {/* Dark Mode Toggle */}
            <div className="relative group/darkmode">
              <button
                onClick={toggleDarkMode}
                className={`group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gradient-to-r hover:from-yellow-900/40 hover:to-gray-800/60 hover:text-white hover:scale-[1.01] hover:shadow-md hover:border hover:border-yellow-900/30'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.01]'
                }`}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5 text-gray-400 group-hover/btn:text-yellow-400 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400 group-hover/btn:text-gray-700 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span className="animate-fadeIn">
                  {isDarkMode ? t('Yorug\' rejim', language) : t('Qorong\'i rejim', language)}
                </span>
              </button>
            </div>

            {/* Til almashtirish tugmasi */}
            <div className="relative group/language">
              <button
                onClick={toggleLanguage}
                className={`group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-900/40 hover:to-gray-800/60 hover:text-white hover:scale-[1.01] hover:shadow-md hover:border hover:border-red-900/30'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700 hover:scale-[1.01]'
                }`}
              >
                <Globe className={`h-5 w-5 flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400 group-hover/btn:text-red-400' : 'text-gray-400 group-hover/btn:text-red-600'}`} />
                <span className="animate-fadeIn">
                  {language === 'latin' ? 'Кирил' : 'Lotin'}
                </span>
              </button>
            </div>

            {/* Chiqish tugmasi */}
            <div className="relative group/logout">
              <button
                onClick={logout}
                className={`group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-800 hover:text-white hover:scale-[1.01] hover:shadow-lg hover:shadow-red-500/50 hover:border hover:border-red-500/30'
                    : 'text-gray-700 hover:bg-red-600 hover:text-white hover:scale-[1.01] hover:shadow-lg'
                }`}
              >
                <LogOut className={`h-5 w-5 flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400 group-hover/btn:text-white' : 'text-gray-400 group-hover/btn:text-white'}`} />
                <span className="animate-fadeIn">{t("Chiqish", language)}</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`min-h-screen transition-all duration-300 ${
        isMobile ? 'pl-0' : (isWarehousePage ? 'pl-0' : 'pl-72')
      } ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <main className={`${isMobile ? 'pt-20 pb-20' : (isWarehousePage ? 'py-0' : 'py-8')}`}>
          <div className={`mx-auto ${isWarehousePage ? 'max-w-full px-0' : (isCashierPage || isDebtsPage) ? 'max-w-full px-4 sm:px-6 lg:px-8' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation - faqat mobile uchun */}
      {isMobile && !isWarehousePage && <BottomNavbar />}
    </div>
  );
};

export default Layout;