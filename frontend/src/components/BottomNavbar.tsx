import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Car, 
  CreditCard, 
  Users,
  Award,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const BottomNavbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Dark mode state - faqat o'qish uchun
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Dark mode o'zgarishini kuzatish
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('darkMode');
      setIsDarkMode(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Interval bilan ham tekshirish (bir tab ichida o'zgarishlar uchun)
    const interval = setInterval(() => {
      const saved = localStorage.getItem('darkMode');
      setIsDarkMode(saved === 'true');
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const masterNavigation = [
    { name: t('Mijozlar', language), href: '/app/master/bookings', icon: Calendar },
    { name: t('Shogirdlar', language), href: '/app/master/apprentices', icon: Users },
    { name: t('Kassa', language), href: '/app/master/cashier', icon: CreditCard },
    { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
    { name: t('Qarzlar', language), href: '/app/debts', icon: BookOpen },
  ];

  const apprenticeNavigation = [
    { name: t('Vazifalar', language), href: '/app/apprentice/tasks', icon: CheckSquare },
    { name: t('Panel', language), href: '/app/dashboard', icon: LayoutDashboard },
    { name: t('Daromad', language), href: '/app/apprentice/achievements', icon: Award },
  ];

  const navigation = user?.role === 'master' ? masterNavigation : apprenticeNavigation;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t shadow-2xl md:hidden transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-t from-gray-900 via-gray-900 to-gray-800/95 border-red-900/30'
        : 'bg-white/95 border-gray-200/50'
    }`}>
      <div className="flex items-center justify-around px-1 py-2">
        {/* Navigation Items */}
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isCenter = index === 2; // O'rtadagi element

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                isCenter ? 'flex-1 max-w-[70px]' : 'flex-1 max-w-[60px]'
              }`}
            >
              {/* Center button - larger and elevated */}
              {isCenter ? (
                <div className="relative -mt-6">
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    active 
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900 shadow-lg shadow-red-500/50 scale-110'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 scale-110'
                      : isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-md'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-md'
                  }`}></div>
                  <div className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl">
                    <Icon className={`transition-all duration-300 ${
                      active 
                        ? 'h-5 w-5 text-white' 
                        : isDarkMode
                          ? 'h-5 w-5 text-gray-400'
                          : 'h-5 w-5 text-gray-600'
                    }`} />
                    {active && (
                      <div className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap transition-all duration-300 ${
                    active 
                      ? isDarkMode
                        ? 'text-red-400'
                        : 'text-blue-600'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                </div>
              ) : (
                /* Side buttons - smaller size */
                <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-300">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                    active 
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900 shadow-md shadow-red-500/30 scale-105'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md scale-105'
                      : isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    <Icon className={`transition-all duration-300 ${
                      active 
                        ? 'h-4 w-4 text-white' 
                        : isDarkMode
                          ? 'h-4 w-4 text-gray-400'
                          : 'h-4 w-4 text-gray-600'
                    }`} />
                  </div>
                  <span className={`mt-0.5 text-[9px] font-medium transition-all duration-300 ${
                    active 
                      ? isDarkMode
                        ? 'text-red-400'
                        : 'text-blue-600'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                  {active && (
                    <div className={`absolute -bottom-0.5 w-1 h-1 rounded-full animate-pulse ${
                      isDarkMode ? 'bg-red-500' : 'bg-blue-600'
                    }`}></div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavbar;
