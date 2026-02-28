import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCarServices } from '@/hooks/useCarServices';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';

interface CarPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onSuccess: () => void;
}

const CarPaymentModalHybrid: React.FC<CarPaymentModalProps> = ({ isOpen, onClose, car, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [cashAmount, setCashAmount] = useState('');
  const [cashAmountDisplay, setCashAmountDisplay] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardAmountDisplay, setCardAmountDisplay] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { updateCar, refresh } = useCarsNew();
  const createTransactionMutation = useCreateTransaction();
  const queryClient = useQueryClient();
  
  // ⚡ INSTANT LOADING: useCarServices hook bilan xizmatlarni cache'dan yuklash
  const { data: carServicesData } = useCarServices({ carId: car?._id });
  
  // Xizmatlarni olish va eng oxirgisini tanlash
  const carService = useMemo(() => {
    if (!carServicesData?.services) return null;
    const services = carServicesData.services;
    // Eng oxirgi xizmatni olish (delivered bo'lmagan)
    return services.find((s: any) => s.status !== 'delivered') || null;
  }, [carServicesData]);
  
  const loadingService = !carServicesData && isOpen; // Faqat birinchi marta yuklanayotganda

  useBodyScrollLock(isOpen);

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ⚡ Mashina xizmati yuklanganida qolgan to'lovni o'rnatish
  useEffect(() => {
    if (car && isOpen && carService) {
      const remaining = carService.totalPrice - (carService.paidAmount || 0);
      const formatted = formatNumber(remaining.toString());
      setCashAmount(remaining.toString());
      setCashAmountDisplay(formatted);
      setCardAmount('');
      setCardAmountDisplay('');
    } else if (car && isOpen && !carService && !loadingService) {
      // Agar xizmat topilmasa, mashina narxini o'rnatish
      const carTotal = car.totalEstimate || 0;
      const formatted = formatNumber(carTotal.toString());
      setCashAmount(carTotal.toString());
      setCashAmountDisplay(formatted);
      setCardAmount('');
      setCardAmountDisplay('');
    }
  }, [car, isOpen, carService, loadingService]);

  if (!isOpen || !car) return null;

  const totalPrice = carService?.totalPrice || car.totalEstimate || 0;
  const paidAmount = carService?.paidAmount || 0;
  const remaining = totalPrice - paidAmount;

  if (loadingService) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}>
          <div className="text-center py-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${
              isDarkMode
                ? 'border-red-900/30 border-t-red-600'
                : 'border-blue-200 border-t-blue-600'
            }`}></div>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {t('Yuklanmoqda...', language)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (totalPrice === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}>
          <button onClick={onClose} className={`absolute top-4 right-4 rounded-lg p-1.5 transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-400 hover:text-gray-600'
          }`}>
            <X className="h-5 w-5" />
          </button>
          <div className="text-center py-8">
            <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
              isDarkMode
                ? 'bg-yellow-900/40'
                : 'bg-yellow-50'
            }`}>
              <AlertCircle className={`h-8 w-8 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{t("Xizmat narxi topilmadi", language)}</h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{t("Bu mashina uchun hali xizmat narxi belgilanmagan.", language)}</p>
            <button onClick={onClose} className={`px-6 py-3 rounded-lg transition-colors font-medium ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              {t("Yopish", language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const totalPayment = cash + card;

    if (totalPayment <= 0) {
      newErrors.payment = t("Kamida bitta to'lov miqdorini kiriting", language);
    } else if (totalPayment > remaining) {
      newErrors.payment = t("To'lov miqdori qolgan summadan oshmasligi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCashAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    setCashAmount(numericValue.toString());
    setCashAmountDisplay(formatted);
    if (errors.payment) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.payment;
        return newErrors;
      });
    }
  };

  const handleCardAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    setCardAmount(numericValue.toString());
    setCardAmountDisplay(formatted);
    if (errors.payment) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.payment;
        return newErrors;
      });
    }
  };

  const handleQuickAmount = (percentage: number, type: 'cash' | 'card') => {
    const quickAmount = Math.round((remaining * percentage) / 100);
    if (type === 'cash') {
      handleCashAmountChange(quickAmount.toString());
    } else {
      handleCardAmountChange(quickAmount.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const totalPayment = cash + card;
    
    const totalPrice = carService?.totalPrice || car.totalEstimate || 0;
    const currentPaidAmount = car.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + totalPayment;
    const isFullyPaid = newPaidAmount >= totalPrice;
    
    // Reset form
    setCashAmount('');
    setCashAmountDisplay('');
    setCardAmount('');
    setCardAmountDisplay('');
    setErrors({});
    
    // ⚡ INSTANT: Modal yopish
    onClose();
    
    // ⚡ OPTIMISTIC UPDATE: Har qanday to'lovda DARHOL faol ro'yxatdan olib tashlash
    console.log('⚡ OPTIMISTIC: To\'lov qilindi - DARHOL faol ro\'yxatdan olib tashlanmoqda...');
    
    // INSTANT: Custom event dispatch (mashina DARHOL yo'qoladi)
    window.dispatchEvent(new CustomEvent('car-fully-paid', { detail: { carId: car._id } }));
    
    // ⚡ SILENT: Hech qanday toast xabar yo'q - faqat background sync

    // 🔥 BACKGROUND: To'lovni backend'ga yuborish
    try {
      console.log('🔵 Background: To\'lov yuborilmoqda:', {
        carService: carService?._id,
        cashAmount: cash,
        cardAmount: card,
        totalPayment,
        isOnline,
        isFullyPaid
      });

      if (isOnline) {
        // Online rejim - API ishlatish
        const { api } = await import('@/lib/api');
        
        // ✨ Agar CarService yo'q bo'lsa, avtomatik yaratish
        let serviceToUse = carService;
        
        if (!serviceToUse) {
          console.log('⚠️ CarService topilmadi, yangi yaratilmoqda...');
          
          const parts = car.parts || [];
          const serviceItems = car.serviceItems || [];
          
          if (parts.length === 0 && serviceItems.length === 0) {
            console.error('❌ Mashina uchun qismlar yoki ish haqi topilmadi');
            
            // ROLLBACK: Mashinani qaytarish
            if (isFullyPaid) {
              window.dispatchEvent(new CustomEvent('cars-refresh'));
            }
            return;
          }
          
          const allItems = [
            ...parts.map((p: any) => ({
              name: p.name,
              description: p.description || '',
              price: p.price,
              quantity: p.quantity || 1,
              category: p.category || 'part'
            })),
            ...serviceItems.map((s: any) => ({
              name: s.name,
              description: s.description || 'Ish haqi',
              price: s.price,
              quantity: s.quantity || 1,
              category: s.category || 'labor'
            }))
          ];
          
          const createServiceResponse = await api.post('/car-services', {
            carId: car._id,
            parts: allItems
          });
          
          serviceToUse = createServiceResponse.data.service;
          console.log('✅ Yangi CarService yaratildi:', serviceToUse._id);
        }

        // To'lovlarni ketma-ket yuborish (race condition oldini olish)
        if (serviceToUse) {
          // Naqd to'lov
          if (cash > 0) {
            await api.post(`/car-services/${serviceToUse._id}/payment`, {
              amount: cash,
              paymentMethod: 'cash',
              notes: t('Naqd', language)
            });
          }

          // Plastik to'lov (naqd to'lov saqlangandan keyin)
          if (card > 0) {
            await api.post(`/car-services/${serviceToUse._id}/payment`, {
              amount: card,
              paymentMethod: 'card',
              notes: t('Plastik', language)
            });
          }
        }
      } else {
        // Offline rejim - IndexedDB ishlatish
        console.log('🔴 Offline rejimda to\'lov');
        
        const transactionPromises = [];
        
        if (cash > 0) {
          transactionPromises.push(
            createTransactionMutation.mutateAsync({
              type: 'income',
              category: t('Mashina to\'lovi', language),
              amount: cash,
              description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Naqd', language)})`,
              paymentMethod: 'cash',
              relatedTo: {
                type: 'car',
                id: car._id
              }
            })
          );
        }
        
        if (card > 0) {
          transactionPromises.push(
            createTransactionMutation.mutateAsync({
              type: 'income',
              category: t('Mashina to\'lovi', language),
              amount: card,
              description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Plastik', language)})`,
              paymentMethod: 'card',
              relatedTo: {
                type: 'car',
                id: car._id
              }
            })
          );
        }
        
        await Promise.all(transactionPromises);
        
        // Mashinaning to'langan miqdorini va paymentStatus'ni yangilash
        let newPaymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
        if (newPaidAmount >= totalPrice) {
          newPaymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newPaymentStatus = 'partial';
        }
        
        await updateCar(car._id, {
          ...car,
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus
        });
        
        console.log('✅ Offline to\'lov muvaffaqiyatli saqlandi');
      }
      
      // ⚡ Background yangilash
      console.log('🔄 Background: Ma\'lumotlar yangilanmoqda...');
      
      // ⚡ FIX: INSTANT refresh - cars-refresh event trigger qilish
      // Bu event useCarsNew hook'ida eshitiladi va DARHOL yangilanadi
      window.dispatchEvent(new CustomEvent('cars-refresh'));
      
      // Parent komponentda refresh
      onSuccess();
      
      // MongoDB'dan yangi ma'lumotlarni yuklash (parallel)
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transactionSummary'] }),
        queryClient.invalidateQueries({ queryKey: ['cars'] }),
        queryClient.invalidateQueries({ queryKey: ['debts'] }),
        queryClient.invalidateQueries({ queryKey: ['car-services'] })
      ]);
      
      console.log('✅ Backend bilan sinxronlashtirildi');
      
      // ⚡ SILENT: Hech qanday toast xabar yo'q
      
    } catch (err) {
      console.error('❌ To\'lov yoki yangilashda xatolik:', err);
      
      // ⚡ SILENT: Xatolik bo'lsa ham toast yo'q, faqat rollback
      // ROLLBACK: Agar to'liq to'langan deb belgilangan bo'lsa, mashinani qaytarish
      if (isFullyPaid) {
        console.log('🔄 ROLLBACK: Xatolik yuz berdi - mashinani qaytarish');
        window.dispatchEvent(new CustomEvent('cars-refresh'));
      }
    }
  };

  const totalPaymentAmount = (Number(cashAmount) || 0) + (Number(cardAmount) || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative rounded-xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 rounded-t-xl ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-green-500 to-emerald-600'
        }`}>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t("To'lov", language)}
              </h2>
              <p className="text-white/90 text-xs">
                {car.licensePlate}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Qolgan summa */}
          <div className={`p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-900/40 to-red-800/40 border-red-700'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
          }`}>
            <div className={`text-xs mb-0.5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{t('Qolgan summa', language)}</div>
            <div className={`text-xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{formatCurrency(remaining)}</div>
          </div>

          {/* Naqd to'lov */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              💵 {t("Naqd", language)}
            </label>
            <input
              type="text"
              value={cashAmountDisplay}
              onChange={(e) => handleCashAmountChange(e.target.value)}
              autoComplete="off"
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-base font-semibold ${
                isDarkMode
                  ? 'bg-gray-800 border-green-700 focus:border-green-500 text-white placeholder:text-gray-500'
                  : 'border-green-300 focus:border-green-500'
              }`}
              placeholder="0"
            />
            
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={() => handleQuickAmount(50, 'cash')} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-colors ${
                isDarkMode
                  ? 'bg-green-900/40 hover:bg-green-900/60 text-green-300'
                  : 'bg-green-100 hover:bg-green-200'
              }`}>
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'cash')} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow'
              }`}>
                {t("To'liq", language)}
              </button>
            </div>
          </div>

          {/* Plastik to'lov */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              💳 {t("Plastik", language)}
            </label>
            <input
              type="text"
              value={cardAmountDisplay}
              onChange={(e) => handleCardAmountChange(e.target.value)}
              autoComplete="off"
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-base font-semibold ${
                isDarkMode
                  ? 'bg-gray-800 border-purple-700 focus:border-purple-500 text-white placeholder:text-gray-500'
                  : 'border-purple-300 focus:border-purple-500'
              }`}
              placeholder="0"
            />
            
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={() => handleQuickAmount(50, 'card')} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-colors ${
                isDarkMode
                  ? 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-300'
                  : 'bg-purple-100 hover:bg-purple-200'
              }`}>
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'card')} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow'
              }`}>
                {t("To'liq", language)}
              </button>
            </div>
            
            {errors.payment && (
              <p className={`mt-1.5 text-xs flex items-center gap-1 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                <AlertCircle className="h-3 w-3" />
                {errors.payment}
              </p>
            )}
          </div>

          {/* Jami to'lov */}
          {totalPaymentAmount > 0 && (
            <div className={`p-2.5 rounded-lg border ${
              isDarkMode
                ? 'bg-blue-900/40 border-blue-700'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between text-xs mb-1">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {t("Jami to'lov", language)}:
                </span>
                <span className={`font-bold ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>{formatCurrency(totalPaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {t("Qoladi", language)}:
                </span>
                <span className={`font-bold ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>{formatCurrency(remaining - totalPaymentAmount)}</span>
              </div>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border border-red-900/30'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg'
              }`}
            >
              {t("Tasdiqlash", language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarPaymentModalHybrid;