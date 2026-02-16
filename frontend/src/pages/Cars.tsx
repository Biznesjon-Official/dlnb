import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useDebts } from '@/hooks/useDebts';
import { useTasks } from '@/hooks/useTasks';
import CreateCarModal from '@/components/CreateCarModal';
import ViewCarModal from '@/components/ViewCarModal';
import EditCarStepModal from '@/components/EditCarStepModal';
import DeleteCarModal from '@/components/DeleteCarModal';
import RestoreCarModal from '@/components/RestoreCarModal';
import CarPaymentModalHybrid from '@/components/CarPaymentModalHybrid';
import {Plus,Search, Car as CarIcon, Eye, Edit, Trash2, Phone, Package2, Filter, CheckCircle, RotateCcw, DollarSign, Users, ClipboardList, XCircle, MessageSquare} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Car } from '@/types';
import { t } from '@/lib/transliteration';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

const Cars: React.FC = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // SMS matni yaratish funksiyasi
  const getSmsMessage = (car: Car) => {
    const remaining = car.totalEstimate - (car.paidAmount || 0);
    
    let message = '';
    
    if (car.status === 'completed' || car.status === 'delivered') {
      // To'liq tugallangan mashinalar uchun
      message = `Hurmatli ${car.ownerName}, sizning ${car.make} ${car.carModel} (${car.licensePlate}) mashinangiz to'liq ta'mirlandi. Xizmat haqi: ${formatCurrency(car.totalEstimate)}. Rahmat!`;
    } else if (remaining > 0) {
      // Qarzi bor mashinalar uchun
      message = `Hurmatli ${car.ownerName}, sizning ${car.make} ${car.carModel} (${car.licensePlate}) mashinangiz ta'mirda. Jami: ${formatCurrency(car.totalEstimate)}, To'langan: ${formatCurrency(car.paidAmount || 0)}, Qoldi: ${formatCurrency(remaining)}. Rahmat!`;
    } else {
      // Oddiy xabar
      message = `Hurmatli ${car.ownerName}, sizning ${car.make} ${car.carModel} (${car.licensePlate}) mashinangiz haqida ma'lumot. Xizmat haqi: ${formatCurrency(car.totalEstimate)}. Rahmat!`;
    }
    
    return message;
  };

  // Backend status
  const { isOnline } = useBackendStatus();

  // New hook - avtomatik online/offline rejimni boshqaradi
  const { 
    cars, 
    loading,
    updateCar,
    getArchivedCars
  } = useCarsNew();

  // Arxivlangan mashinalarni olish
  const [archivedCarsData, setArchivedCarsData] = React.useState<Car[]>([]);
  
  React.useEffect(() => {
    if (activeTab === 'archive') {
      getArchivedCars().then(data => {
        console.log('📦 Serverdan arxivlangan mashinalar:', data.length);
        setArchivedCarsData(data);
      }).catch(err => {
        console.error('Failed to load archived cars:', err);
        toast.error('Arxivlangan mashinalarni yuklashda xatolik');
      });
    }
  }, [activeTab, getArchivedCars]);

  // Qarzlar ro'yxatini olish (qarzi bor mashinalarni aniqlash uchun) - faqat online holatda
  const { data: debtsData } = useDebts({ type: 'receivable' });
  const allDebts = isOnline ? (debtsData?.debts || []) : [];
  
  // Faqat to'lanmagan va qisman to'langan qarzlarni filtrlash
  const activeDebts = allDebts.filter((debt: any) => {
    const remaining = debt.amount - (debt.paidAmount || 0);
    return remaining > 0; // Faqat qarzi qolgan mashinalar
  });
  
  // ⚡ OPTIMIZED: Qarzi bor mashina ID larini memoize qilish
  const carsWithActiveDebtIds = React.useMemo(() => 
    new Set(
      activeDebts
        .filter((debt: any) => debt.car && debt.car._id)
        .map((debt: any) => debt.car._id)
    ),
    [activeDebts]
  );
  
  // ⚡ OPTIMIZED: Qidiruv va filtr - memoized
  const filteredCars = React.useMemo(() => {
    let result = cars;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((car: any) => 
        car.carNumber?.toLowerCase().includes(search) ||
        car.phoneNumber?.toLowerCase().includes(search) ||
        car.ownerName?.toLowerCase().includes(search) ||
        car.make?.toLowerCase().includes(search) ||
        car.carModel?.toLowerCase().includes(search) ||
        car.licensePlate?.toLowerCase().includes(search)
      );
    }
    
    if (statusFilter) {
      result = result.filter((car: any) => car.status === statusFilter);
    }
    
    return result;
  }, [cars, searchTerm, statusFilter]);

  // ⚡ OPTIMIZED: Faol mashinalar - memoized
  const activeCars = React.useMemo(() => 
    filteredCars.filter((car: Car) => {
      // ⚡ FIX: Repository allaqachon faol mashinalarni qaytaradi
      // Shuning uchun bu yerda faqat qo'shimcha filter kerak emas
      // Repository filter: isDeleted !== true, status !== completed/delivered, paymentStatus !== paid
      
      // Qo'shimcha xavfsizlik uchun tekshirish
      if (car.isDeleted === true) return false;
      if (car.status === 'completed' || car.status === 'delivered') return false;
      if (car.paymentStatus === 'paid') return false;
      
      return true;
    }),
    [filteredCars]
  );
  
  // ⚡ OPTIMIZED: Arxiv mashinalar - memoized
  const archivedCars = React.useMemo(() => {
    // Agar arxiv tab'da bo'lsak, serverdan olingan ma'lumotlarni ishlatamiz
    if (activeTab === 'archive') {
      // Agar serverdan ma'lumot kelgan bo'lsa, uni ishlatamiz
      if (archivedCarsData.length > 0) {
        const filtered = archivedCarsData.filter((car: Car) => {
          // Qidiruv va filtr
          if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matches = car.licensePlate?.toLowerCase().includes(search) ||
              car.ownerPhone?.toLowerCase().includes(search) ||
              car.ownerName?.toLowerCase().includes(search) ||
              car.make?.toLowerCase().includes(search) ||
              car.carModel?.toLowerCase().includes(search);
            if (!matches) return false;
          }
          
          if (statusFilter && car.status !== statusFilter) {
            return false;
          }
          
          return true;
        });
        
        console.log('📦 Arxiv: Serverdan:', archivedCarsData.length, 'Filtrlangandan keyin:', filtered.length);
        return filtered;
      }
      
      // Agar serverdan hali ma'lumot kelmagan bo'lsa, bo'sh array qaytaramiz
      // (useEffect ichida yuklanyapti)
      return [];
    }
    
    // Aks holda, local ma'lumotlardan filtrlash (faol tab'da)
    return filteredCars.filter((car: Car) => {
      // Arxivlangan mashinalar: isDeleted yoki to'liq to'langan
      return car.isDeleted || 
             car.status === 'completed' || 
             car.status === 'delivered' ||
             carsWithActiveDebtIds.has(car._id);
    });
  }, [activeTab, archivedCarsData, filteredCars, carsWithActiveDebtIds, searchTerm, statusFilter]);
  
  // ⚡ OPTIMIZED: Ko'rsatiladigan mashinalar - memoized
  const displayedCars = React.useMemo(() => 
    activeTab === 'active' ? activeCars : archivedCars,
    [activeTab, activeCars, archivedCars]
  );

  const handleViewCar = (car: Car) => {
    setSelectedCar(car);
    setIsViewModalOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const handleDeleteCar = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handlePaymentCar = (car: Car) => {
    setSelectedCar(car);
    setIsPaymentModalOpen(true);
  };

  const handleEditFromView = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteFromView = () => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };
  
  const handleRestoreCar = (car: Car) => {
    setSelectedCar(car);
    setIsRestoreModalOpen(true);
  };

  const closeAllModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsRestoreModalOpen(false);
    setSelectedCar(null);
  };

  // Unused function - commented out
  // const getStatusConfig = (status: string) => {
  //   switch (status) {
  //     case 'pending': 
  //       return { 
  //         bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', 
  //         text: 'text-amber-700',
  //         border: 'border-amber-200',
  //         dot: 'bg-amber-500'
  //       };
  //     case 'in-progress': 
  //       return { 
  //         bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
  //         text: 'text-blue-700',
  //         border: 'border-blue-200',
  //         dot: 'bg-blue-500'
  //       };
  //     case 'completed': 
  //       return { 
  //         bg: 'bg-gradient-to-r from-green-50 to-emerald-50', 
  //         text: 'text-green-700',
  //         border: 'border-green-200',
  //         dot: 'bg-green-500'
  //       };
  //     case 'delivered': 
  //       return { 
  //         bg: 'bg-gradient-to-r from-gray-50 to-slate-50', 
  //         text: 'text-gray-700',
  //         border: 'border-gray-200',
  //         dot: 'bg-gray-500'
  //       };
  //     default: 
  //       return { 
  //         bg: 'bg-gray-50', 
  //         text: 'text-gray-700',
  //         border: 'border-gray-200',
  //         dot: 'bg-gray-500'
  //       };
  //   }
  // };

  // Unused function - commented out
  // const getStatusText = (status: string) => {
  //   switch (status) {
  //     case 'pending': return t('Kutilmoqda', language);
  //     case 'in-progress': return t('Jarayonda', language);
  //     case 'completed': return t('Tayyor', language);
  //     case 'delivered': return t('Topshirilgan', language);
  //     default: return status;
  //   }
  // };

  return (
    <div className={`min-h-screen p-2 sm:p-6 pb-20 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20'
    }`}>
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
        {/* Mobile-First Header */}
        <div className={`relative overflow-hidden rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8 ${
          isDarkMode
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700'
        }`}>
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl ${
            isDarkMode ? 'bg-red-500/20' : 'bg-orange-500/20'
          }`}></div>
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                <CarIcon className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                  {t("Avtomobillar", language)}
                  {!isOnline && (
                    <span className="text-xs sm:text-sm bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-md border border-red-300/30">
                      {t("Offline", language)}
                    </span>
                  )}
                </h1>
                <p className={`text-xs sm:text-base lg:text-lg ${
                  isDarkMode ? 'text-red-100' : 'text-orange-100'
                }`}>
                  {activeTab === 'active' ? activeCars.length : archivedCars.length} ta avtomobil
                  {!isOnline && (
                    <span className="ml-2 text-yellow-200">
                      • {t("IndexedDB dan", language)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`group relative px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 w-full sm:w-auto ${
                isDarkMode
                  ? 'bg-white hover:bg-gray-100 text-red-600'
                  : 'bg-white hover:bg-orange-50 text-orange-600'
              }`}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-sm sm:text-base font-semibold">
                {t("Yangi mashina", language)}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile-First Filters */}
        <div className={`rounded-lg sm:rounded-2xl shadow-lg border p-3 sm:p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100'
        }`}>
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder={t("Qidirish...", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 transition-all text-sm font-medium ${
                  isDarkMode
                    ? 'bg-gray-800 border border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500'
                }`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full sm:w-auto pl-10 pr-8 py-3 rounded-xl focus:ring-2 transition-all text-sm font-medium appearance-none cursor-pointer sm:min-w-[180px] ${
                  isDarkMode
                    ? 'bg-gray-800 border border-red-900/30 text-white focus:ring-red-500 focus:border-red-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                }`}
              >
                <option value="">{t("Barcha holatlar", language)}</option>
                <option value="pending">{t("Kutilmoqda", language)}</option>
                <option value="in-progress">{t("Jarayonda", language)}</option>
                <option value="completed">{t("Tayyor", language)}</option>
                <option value="delivered">{t("Topshirilgan", language)}</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Faol va Arxiv - Compact Right */}
        <div className="flex justify-end">
            <div className={`inline-flex backdrop-blur-sm rounded-lg shadow-sm border p-0.5 ${
              isDarkMode
                ? 'bg-gray-800/80 border-gray-700/50'
                : 'bg-white/80 border-gray-200/50'
            }`}>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  activeTab === 'active'
                    ? isDarkMode
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-orange-600 text-white shadow-sm'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CarIcon className="h-3.5 w-3.5" />
                  <span>{t('Faol', language)}</span>
                  <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                    activeTab === 'active' 
                      ? 'bg-white/20' 
                      : isDarkMode
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-orange-50 text-orange-600'
                  }`}>
                    {activeCars.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  activeTab === 'archive'
                    ? 'bg-green-600 text-white shadow-sm'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package2 className="h-3.5 w-3.5" />
                  <span>{t('Arxiv', language)}</span>
                  <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                    activeTab === 'archive' 
                      ? 'bg-white/20' 
                      : isDarkMode
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-green-50 text-green-600'
                  }`}>
                    {archivedCars.length}
                  </span>
                </div>
              </button>
            </div>
          </div>

        {/* Cars Grid */}
        {loading ? (
          // ⚡ SKELETON LOADER - Ma'lumotlar yuklanayotganda
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`rounded-lg sm:rounded-2xl shadow-lg border p-4 sm:p-6 animate-pulse ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded w-3/4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 rounded w-1/2 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-8 w-8 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-8 w-8 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-8 w-8 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedCars.length === 0 ? (
          <div className={`rounded-lg sm:rounded-2xl shadow-lg border p-6 sm:p-16 text-center ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-100'
          }`}>
            <div className="max-w-md mx-auto">
              <div className={`rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-900/40 to-red-800/40'
                  : 'bg-gradient-to-br from-orange-50 to-red-50'
              }`}>
                <CarIcon className={`h-8 w-8 sm:h-12 sm:w-12 ${
                  isDarkMode ? 'text-red-400' : 'text-orange-600'
                }`} />
              </div>
              <h3 className={`text-lg sm:text-2xl font-bold mb-2 sm:mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {!isOnline 
                  ? t("Offline holatda mashinalar topilmadi", language)
                  : activeTab === 'active' 
                    ? t("Faol mashinalar topilmadi", language) 
                    : t("Arxivda mashinalar yo'q", language)
                }
              </h3>
              <p className={`mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {!isOnline
                  ? t("Offline rejimda faqat IndexedDB dagi mashinalar ko'rinadi. Internet aloqasi tiklanganida barcha ma'lumotlar sinxronlanadi.", language)
                  : activeTab === 'active' 
                    ? t("Tizimga birinchi mashinani qo'shishdan boshlang va ta'mirlash jarayonini boshqaring.", language)
                    : t("To'liq to'langan mashinalar avtomatik arxivga o'tkaziladi.", language)
                }
              </p>
              {(isOnline || activeTab === 'active') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className={`inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                  }`}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {!isOnline 
                    ? t("Offline mashina qo'shish", language)
                    : t("Birinchi mashinani qo'shish", language)
                  }
                </button>
              )}
            </div>
          </div>
        ) : activeTab === 'archive' ? (
          // Arxiv - Optimized UX Desktop Table
          <div className={`rounded-lg sm:rounded-2xl shadow-xl border overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
              : 'bg-white border-gray-200'
          }`}>
            {/* Desktop Table - faqat katta ekranlarda */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode 
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
                  : 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600'
                }>
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[25%]">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("Mijoz", language)}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[22%]">
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        {t("Avtomobil", language)}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[18%]">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t("Moliya", language)}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-[15%]">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t("Aloqa", language)}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-[20%]">
                      {t("Amallar", language)}
                    </th>
                  </tr>
                </thead>
                <tbody className={isDarkMode ? 'divide-y divide-red-900/30' : 'divide-y divide-gray-100'}>
                  {displayedCars.map((car: Car, index: number) => {
                    const partsTotal = (car.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
                    const serviceItemsTotal = ((car as any).serviceItems || []).reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
                    const calculatedTotal = partsTotal + serviceItemsTotal;
                    const displayTotal = car.totalEstimate || calculatedTotal;
                    
                    const paidAmount = car.paidAmount || 0;
                    const hasCarDebt = displayTotal > paidAmount;
                    const hasActiveDebt = carsWithActiveDebtIds.has(car._id);
                    const remainingAmount = displayTotal - paidAmount;
                    const hasDebt = hasActiveDebt || hasCarDebt;
                    
                    return (
                      <tr key={car._id} className={`transition-all duration-200 ${
                        isDarkMode
                          ? car.isDeleted 
                            ? 'bg-red-900/20 hover:bg-red-900/30' 
                            : hasDebt 
                              ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-l-4 border-l-red-500 hover:bg-red-900/30' 
                              : index % 2 === 0 
                                ? 'bg-gray-800/50 hover:bg-gray-800/70' 
                                : 'bg-gray-900/50 hover:bg-gray-900/70'
                          : car.isDeleted 
                            ? 'bg-red-50/40' 
                            : hasDebt 
                              ? 'bg-gradient-to-r from-red-50/40 to-orange-50/30 border-l-4 border-l-red-500' 
                              : index % 2 === 0 
                                ? 'bg-white' 
                                : 'bg-green-50/20'
                      } ${isDarkMode ? 'hover:bg-gradient-to-r hover:from-gray-800/70 hover:to-red-900/30' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30'}`}>
                        {/* Mijoz */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center shadow-md ring-2 ${
                              isDarkMode
                                ? car.isDeleted 
                                  ? 'bg-gradient-to-br from-red-600 to-pink-700 ring-red-900/50' 
                                  : hasDebt 
                                    ? 'bg-gradient-to-br from-red-600 to-red-700 ring-red-900/50' 
                                    : 'bg-gradient-to-br from-red-500 to-red-600 ring-red-900/50'
                                : car.isDeleted 
                                  ? 'bg-gradient-to-br from-red-400 to-pink-500 ring-white' 
                                  : hasDebt 
                                    ? 'bg-gradient-to-br from-red-400 to-orange-500 ring-white' 
                                    : 'bg-gradient-to-br from-emerald-400 to-teal-500 ring-white'
                            }`}>
                              <span className="text-white font-bold text-base">
                                {car.ownerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>{car.ownerName}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {car.isDeleted && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-red-900/40 text-red-300 border-red-700'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }`}>
                                    <XCircle className="h-2.5 w-2.5 mr-0.5" />
                                    {t("O'chirilgan", language)}
                                  </span>
                                )}
                                {hasDebt && !car.isDeleted && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-red-900/40 text-red-300 border-red-700'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }`}>
                                    <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                                    {t("Qarzi bor", language)}
                                  </span>
                                )}
                                {!hasDebt && !car.isDeleted && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isDarkMode
                                      ? 'bg-green-900/40 text-green-300 border-green-700'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}>
                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                    {t("To'langan", language)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Avtomobil */}
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                                isDarkMode
                                  ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40'
                                  : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                              }`}>
                                <CarIcon className={`h-4 w-4 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold truncate ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {car.make} {car.carModel}
                                </p>
                                <p className={`text-xs font-medium ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{car.year}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ${
                              isDarkMode
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                            }`}>
                              {car.licensePlate}
                            </span>
                          </div>
                        </td>
                        
                        {/* Moliya */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>{t("Jami", language)}:</span>
                              <span className={`text-sm font-black ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {formatCurrency(displayTotal, language)}
                              </span>
                            </div>
                            {paidAmount > 0 && (
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{t("To'langan", language)}:</span>
                                <span className={`text-xs font-bold ${
                                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                }`}>
                                  {formatCurrency(paidAmount, language)}
                                </span>
                              </div>
                            )}
                            {hasDebt && (
                              <div className={`flex items-center justify-between pt-1 border-t ${
                                isDarkMode ? 'border-red-800' : 'border-red-200'
                              }`}>
                                <span className={`text-xs font-bold ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>{t("Qarz", language)}:</span>
                                <span className={`text-sm font-black ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  {formatCurrency(remainingAmount, language)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Aloqa */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
                              isDarkMode
                                ? 'text-gray-300 bg-gray-800/50 border border-red-900/30'
                                : 'text-gray-700 bg-gray-50'
                            }`}>
                              <Phone className={`h-3.5 w-3.5 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span className="truncate">{car.ownerPhone}</span>
                            </div>
                            {car.ownerPhone && (
                              <a
                                href={`sms:${car.ownerPhone}?body=${encodeURIComponent(getSmsMessage(car))}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 text-xs font-bold ${
                                  isDarkMode
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                                }`}
                                title={t("SMS yuborish", language)}
                                onClick={(e) => {
                                  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                                    e.preventDefault();
                                    toast.error(t('SMS yuborish faqat mobil qurilmalarda ishlaydi', language));
                                  }
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                {t("SMS", language)}
                              </a>
                            )}
                          </div>
                        </td>
                        
                        {/* Amallar */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewCar(car)}
                              className={`inline-flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 ${
                                isDarkMode
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                              }`}
                              title={t("Ko'rish", language)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {car.isDeleted ? (
                              <button
                                onClick={() => handleRestoreCar(car)}
                                className={`inline-flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 ${
                                  isDarkMode
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                                }`}
                                title={t("Qaytarish", language)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteCar(car)}
                                className={`inline-flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 ${
                                  isDarkMode
                                    ? 'bg-gradient-to-r from-red-600 to-pink-700 text-white hover:from-red-700 hover:to-pink-800'
                                    : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                                }`}
                                title={t("O'chirish", language)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            
                            {!hasDebt && !car.isDeleted && (
                              <div className={`inline-flex items-center justify-center p-2.5 rounded-lg ${
                                isDarkMode
                                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`} title={t("Tugallangan", language)}>
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards - faqat kichik ekranlarda */}
            <div className={`lg:hidden ${isDarkMode ? 'divide-y divide-red-900/30' : 'divide-y divide-gray-200'}`}>
              {displayedCars.map((car: Car) => {
                const partsTotal = (car.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
                const serviceItemsTotal = ((car as any).serviceItems || []).reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
                const calculatedTotal = partsTotal + serviceItemsTotal;
                const displayTotal = car.totalEstimate || calculatedTotal;
                
                const paidAmount = car.paidAmount || 0;
                const hasCarDebt = displayTotal > paidAmount;
                const hasActiveDebt = carsWithActiveDebtIds.has(car._id);
                const remainingAmount = displayTotal - paidAmount;
                const hasDebt = hasActiveDebt || hasCarDebt;
                
                return (
                  <div 
                    key={car._id} 
                    className={`p-4 ${
                      isDarkMode
                        ? car.isDeleted 
                          ? 'bg-red-900/20' 
                          : hasDebt 
                            ? 'bg-red-900/20 border-l-4 border-l-red-500' 
                            : 'bg-gray-800/30'
                        : car.isDeleted 
                          ? 'bg-red-50/50' 
                          : hasDebt 
                            ? 'bg-red-50/30 border-l-4 border-l-red-500' 
                            : 'bg-green-50/30'
                    }`}
                  >
                    {/* Header - Egasi */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                          isDarkMode
                            ? car.isDeleted 
                              ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40' 
                              : hasDebt 
                                ? 'bg-gradient-to-br from-red-900/40 to-red-800/40' 
                                : 'bg-gradient-to-br from-green-900/40 to-emerald-900/40'
                            : car.isDeleted 
                              ? 'bg-gradient-to-br from-red-100 to-pink-100' 
                              : hasDebt 
                                ? 'bg-gradient-to-br from-red-100 to-orange-100' 
                                : 'bg-gradient-to-br from-green-100 to-emerald-100'
                        }`}>
                          <span className={`font-bold text-lg ${
                            isDarkMode
                              ? car.isDeleted 
                                ? 'text-red-300' 
                                : hasDebt 
                                  ? 'text-red-300' 
                                  : 'text-green-300'
                              : car.isDeleted 
                                ? 'text-red-700' 
                                : hasDebt 
                                  ? 'text-red-700' 
                                  : 'text-green-700'
                          }`}>
                            {car.ownerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{car.ownerName}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Phone className={`h-3.5 w-3.5 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{car.ownerPhone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mashina ma'lumotlari */}
                    <div className={`rounded-lg p-3 mb-3 space-y-2 ${
                      isDarkMode
                        ? 'bg-gray-800/50 border border-red-900/30'
                        : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CarIcon className={`h-5 w-5 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {car.make} {car.carModel}
                          </span>
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{car.year}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{t("Raqam", language)}:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {car.licensePlate}
                        </span>
                      </div>
                    </div>
                    
                    {/* Moliyaviy ma'lumotlar */}
                    <div className={`rounded-lg p-3 mb-3 space-y-2 ${
                      isDarkMode
                        ? 'bg-gray-800/50 border border-red-900/30'
                        : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{t("Jami", language)}:</span>
                        <span className={`text-sm font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatCurrency(displayTotal, language)}
                        </span>
                      </div>
                      {paidAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t("To'langan", language)}:</span>
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            {formatCurrency(paidAmount, language)}
                          </span>
                        </div>
                      )}
                      {hasDebt && (
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t("Qarz", language)}:</span>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {formatCurrency(remainingAmount, language)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {car.isDeleted && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          isDarkMode
                            ? 'bg-red-900/40 text-red-300 border border-red-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t("O'chirilgan", language)}
                        </span>
                      )}
                      {hasDebt && !car.isDeleted && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          isDarkMode
                            ? 'bg-red-900/40 text-red-300 border border-red-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {t("Qarzi bor", language)}
                        </span>
                      )}
                      {!hasDebt && !car.isDeleted && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          isDarkMode
                            ? 'bg-green-900/40 text-green-300 border border-green-700'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("To'liq to'langan", language)}
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewCar(car)}
                        className={`flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                          isDarkMode
                            ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-700'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        {t("Ko'rish", language)}
                      </button>
                      
                      {car.ownerPhone && (
                        <a
                          href={`sms:${car.ownerPhone}?body=${encodeURIComponent(getSmsMessage(car))}`}
                          className={`flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                            isDarkMode
                              ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-700'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          }`}
                          onClick={(e) => {
                            if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                              e.preventDefault();
                              toast.error(t('SMS yuborish faqat mobil qurilmalarda ishlaydi', language));
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1.5" />
                          {t("SMS", language)}
                        </a>
                      )}
                      
                      {car.isDeleted && (
                        <button
                          onClick={() => handleRestoreCar(car)}
                          className={`flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                            isDarkMode
                              ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60 border border-green-700'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          {t("Qaytarish", language)}
                        </button>
                      )}
                      
                      {!car.isDeleted && (
                        <button
                          onClick={() => handleDeleteCar(car)}
                          className={`flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                            isDarkMode
                              ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-700'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          {t("O'chirish", language)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Arxiv statistikasi */}
            <div className={`px-4 sm:px-6 py-4 border-t ${
              isDarkMode
                ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-red-900/30'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="flex flex-col gap-3">
                {/* Birinchi qator - Mobile: vertikal, Desktop: gorizontal */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`text-xs sm:text-sm font-semibold ${
                        isDarkMode ? 'text-green-300' : 'text-green-700'
                      }`}>
                        {t("Jami arxivlangan", language)}: {displayedCars.length} ta
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trash2 className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs sm:text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t("O'chirilgan", language)}: {displayedCars.filter((car: Car) => car.isDeleted === true).length} ta
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <span className={`text-xs sm:text-sm font-semibold ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        {t("Tugallangan", language)}: {displayedCars.filter((car: Car) => car.status === 'completed' || car.status === 'delivered').length} ta
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Ikkinchi qator - To'lov statistikasi - Mobile: vertikal, Desktop: gorizontal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                    }`}>
                      {t("To'liq to'langan", language)}: {displayedCars.filter((car: Car) => {
                        const total = car.totalEstimate || 0;
                        const paid = car.paidAmount || 0;
                        return total > 0 && paid >= total; // To'liq to'langan
                      }).length} ta
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-600'
                    }`} />
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-amber-300' : 'text-amber-700'
                    }`}>
                      {t("Qisman to'langan", language)}: {displayedCars.filter((car: Car) => {
                        const total = car.totalEstimate || 0;
                        const paid = car.paidAmount || 0;
                        return total > 0 && paid > 0 && paid < total; // Qisman to'langan
                      }).length} ta
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-red-300' : 'text-red-700'
                    }`}>
                      {t("To'lanmagan", language)}: {displayedCars.filter((car: Car) => {
                        const total = car.totalEstimate || 0;
                        const paid = car.paidAmount || 0;
                        return total > 0 && paid === 0; // To'lanmagan
                      }).length} ta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Faol mashinalar - Karta ko'rinishi
          <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {displayedCars.map((car: Car) => {
              // Narxni hisoblash (fallback sifatida)
              const partsTotal = (car.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
              const serviceItemsTotal = ((car as any).serviceItems || []).reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
              const calculatedTotal = partsTotal + serviceItemsTotal;
              
              // Backend dan kelgan totalEstimate ni ishlatish, agar mavjud bo'lsa
              const displayTotal = car.totalEstimate || calculatedTotal;
              
              return <CarCard key={car._id} car={car} displayTotal={displayTotal} language={language} isDarkMode={isDarkMode} onView={handleViewCar} onEdit={handleEditCar} onDelete={handleDeleteCar} onPayment={handlePaymentCar} getSmsMessage={getSmsMessage} />;
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCarModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {selectedCar && (
        <>
          <ViewCarModal
            isOpen={isViewModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
            onEdit={handleEditFromView}
            onDelete={handleDeleteFromView}
          />
          
          <EditCarStepModal
            isOpen={isEditModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
            updateCar={async (id, data) => {
              await updateCar(id, data);
            }}
          />
          
          <DeleteCarModal
            isOpen={isDeleteModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
          />
          
          <RestoreCarModal
            isOpen={isRestoreModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
          />
          
          <CarPaymentModalHybrid
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedCar(null);
            }}
            onSuccess={() => {
              // Modal yopish
              setIsPaymentModalOpen(false);
              setSelectedCar(null);
              
              // ⚡ INSTANT REFRESH: Darhol mashinalar ro'yxatini yangilash (reload yo'q!)
              console.log('🔄 onSuccess: To\'lov qo\'shildi, mashinalar yangilanmoqda...');
              
              // Cache'ni tozalash
              queryClient.invalidateQueries({ queryKey: ['cars'] });
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['car-services'] });
              queryClient.invalidateQueries({ queryKey: ['debts'] });
              
              // Darhol refetch qilish (reload yo'q!)
              queryClient.refetchQueries({ queryKey: ['cars'] });
              
              // Custom event dispatch
              window.dispatchEvent(new CustomEvent('cars-refresh'));
            }}
            car={selectedCar}
          />
        </>
      )}
    </div>
  );
};

// CarCard component to display individual car with tasks
const CarCard: React.FC<{
  car: Car;
  displayTotal: number;
  language: 'latin' | 'cyrillic';
  isDarkMode: boolean;
  onView: (car: Car) => void;
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
  onPayment: (car: Car) => void;
  getSmsMessage: (car: Car) => string;
}> = ({ car, displayTotal, language, isDarkMode, onView, onEdit, onDelete, onPayment, getSmsMessage }) => {
  // Fetch tasks for this car ONLY
  const { data: tasksData } = useTasks({ car: car._id });
  const tasks = tasksData?.tasks || [];
  
  // Get unique apprentices from tasks (faqat shu mashinaga tegishli vazifalardan)
  const apprentices = React.useMemo(() => {
    const apprenticeMap = new Map();
    tasks.forEach((task: any) => {
      task.assignments?.forEach((assignment: any) => {
        if (assignment.apprentice && assignment.apprentice._id) {
          apprenticeMap.set(assignment.apprentice._id, assignment.apprentice);
        }
      });
    });
    return Array.from(apprenticeMap.values());
  }, [tasks]);

  return (
    <div className={`group relative rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
        : 'bg-white border-gray-100 hover:border-orange-200'
    }`}>
      {/* Card Header */}
      <div className={`p-3 sm:p-6 pb-4 sm:pb-8 ${
        isDarkMode
          ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
          : 'bg-gradient-to-br from-orange-600 via-orange-700 to-red-700'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
            <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <CarIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-white mb-1 break-words">
                {car.make} {car.carModel} {car.year}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs sm:text-sm font-bold tracking-wider ${
                  isDarkMode ? 'text-red-100' : 'text-orange-100'
                }`}>{car.licensePlate}</span>
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  car.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  car.status === 'in-progress' ? isDarkMode ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800' :
                  car.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {car.status === 'pending' && t('Kutilmoqda', language)}
                  {car.status === 'in-progress' && t('Jarayonda', language)}
                  {car.status === 'completed' && t('Tayyor', language)}
                  {car.status === 'delivered' && t('Topshirilgan', language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
        {/* Owner Info */}
        <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700'
            : 'bg-gradient-to-r from-gray-50 to-orange-50/50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{t("Egasi", language)}</span>
          </div>
          <p className={`text-sm sm:text-base font-bold mb-1 sm:mb-2 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-900'
          }`}>{car.ownerName}</p>
          <div className={`flex items-center space-x-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{car.ownerPhone}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
            isDarkMode
              ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-900/30'
              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'
          }`}>
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <Package2 className={`h-3 w-3 sm:h-4 sm:w-4 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className={`text-xs font-semibold uppercase hidden sm:inline ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>{t("Qismlar", language)}</span>
            </div>
            <p className={`text-base sm:text-2xl font-bold ${
              isDarkMode ? 'text-gray-200' : 'text-purple-900'
            }`}>{car.parts?.length || 0}</p>
            <p className={`text-xs sm:hidden ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{t("qism", language)}</p>
          </div>
          <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
            isDarkMode
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-900/30'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
          }`}>
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <DollarSign className={`h-3 w-3 sm:h-4 sm:w-4 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`text-xs font-semibold uppercase hidden sm:inline ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>{t("Narx", language)}</span>
            </div>
            <p className={`text-sm sm:text-lg font-bold truncate ${
              isDarkMode ? 'text-gray-200' : 'text-green-900'
            }`}>
              {displayTotal > 0 ? formatCurrency(displayTotal, language) : t("0 so'm", language)}
            </p>
          </div>
        </div>

        {/* Tasks Section - NEW */}
        {tasks.length > 0 && (
          <div 
            className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${
              isDarkMode
                ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-900/30'
                : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-600 uppercase">{t("Vazifalar", language)}</span>
              </div>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                {tasks.length}
              </span>
            </div>
            
            {/* Apprentices */}
            {apprentices.length > 0 && (
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-3 w-3 text-orange-500 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {apprentices.map((apprentice: any) => (
                    <span
                      key={apprentice._id}
                      className="inline-flex items-center px-2 py-0.5 bg-white border border-orange-200 rounded-md text-xs font-medium text-orange-700"
                    >
                      {apprentice.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Task Status Summary */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {tasks.filter((t: any) => t.status === 'assigned').length > 0 && (
                <span className="text-blue-600">
                  {tasks.filter((t: any) => t.status === 'assigned').length} {t("berilgan", language)}
                </span>
              )}
              {tasks.filter((t: any) => t.status === 'in-progress').length > 0 && (
                <span className="text-yellow-600">
                  {tasks.filter((t: any) => t.status === 'in-progress').length} {t("jarayonda", language)}
                </span>
              )}
              {tasks.filter((t: any) => t.status === 'completed').length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold border border-green-300">
                  {tasks.filter((t: any) => t.status === 'completed').length} {t("tugallangan", language)} ✓
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Desktop: Bir qatorda barcha tugmalar */}
        <div className={`hidden sm:flex items-center gap-1.5 pt-4 border-t ${
          isDarkMode ? 'border-red-900/30' : 'border-gray-100'
        }`}>
          {/* Payment Button - Show if car has remaining balance */}
          {(() => {
            const remaining = displayTotal - (car.paidAmount || 0);
            return remaining > 0 && (
              <button 
                onClick={() => onPayment(car)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium group ${
                  isDarkMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
                title={t("To'lov", language)}
              >
                <DollarSign className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">{t("To'lov", language)}</span>
              </button>
            );
          })()}
          
          {/* SMS Button */}
          {car.ownerPhone && (
            <a 
              href={`sms:${car.ownerPhone}?body=${encodeURIComponent(getSmsMessage(car))}`}
              className={`px-3 py-2 rounded-lg transition-all duration-200 group flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700'
              }`}
              title={t("SMS yuborish", language)}
              onClick={(e) => {
                if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                  e.preventDefault();
                  toast.error(t('SMS yuborish faqat mobil qurilmalarda ishlaydi', language));
                }
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-sm">{t("SMS", language)}</span>
            </a>
          )}
          
          <button 
            onClick={() => onView(car)}
            className={`p-2 rounded-lg transition-all duration-200 group ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600 border border-red-900/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
            }`}
            title={t("Ko'rish", language)}
          >
            <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onEdit(car)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'bg-red-700 text-white hover:bg-red-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={t("Tahrirlash", language)}
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => onDelete(car)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
            }`}
            title={t("O'chirish", language)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile: Ikki qatorda tugmalar */}
        <div className={`sm:hidden space-y-2 pt-2 border-t ${
          isDarkMode ? 'border-red-900/30' : 'border-gray-100'
        }`}>
          {/* Birinchi qator: Asosiy tugmalar */}
          <div className="flex items-center gap-2">
            {(() => {
              const remaining = displayTotal - (car.paidAmount || 0);
              return remaining > 0 && (
                <button 
                  onClick={() => onPayment(car)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                    isDarkMode
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={t("To'lov", language)}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">{t("To'lov", language)}</span>
                </button>
              );
            })()}
            
            {car.ownerPhone && (
              <a 
                href={`sms:${car.ownerPhone}?body=${encodeURIComponent(getSmsMessage(car))}`}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                  isDarkMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
                title={t("SMS yuborish", language)}
                onClick={(e) => {
                  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    e.preventDefault();
                    toast.error(t('SMS yuborish faqat mobil qurilmalarda ishlaydi', language));
                  }
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">{t("SMS", language)}</span>
              </a>
            )}
            
            <button 
              onClick={() => onView(car)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600 border border-red-900/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
              title={t("Ko'rish", language)}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
          
          {/* Ikkinchi qator: Tahrirlash va O'chirish */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(car)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                isDarkMode
                  ? 'bg-red-700 text-white hover:bg-red-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={t("Tahrirlash", language)}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="text-xs">{t("Tahrirlash", language)}</span>
            </button>
            
            <button 
              onClick={() => onDelete(car)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                isDarkMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
              title={t("O'chirish", language)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="text-xs">{t("O'chirish", language)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;