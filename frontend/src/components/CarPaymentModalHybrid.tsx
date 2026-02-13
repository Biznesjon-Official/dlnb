import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCarServices } from '@/hooks/useCarServices';
import { useQueryClient } from '@tanstack/react-query';

interface CarPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onSuccess: () => void;
}

const CarPaymentModalHybrid: React.FC<CarPaymentModalProps> = ({ isOpen, onClose, car, onSuccess }) => {
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
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (totalPrice === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center py-8">
            <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("Xizmat narxi topilmadi", language)}</h3>
            <p className="text-gray-600 mb-6">{t("Bu mashina uchun hali xizmat narxi belgilanmagan.", language)}</p>
            <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
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
      setCardAmount('0');
      setCardAmountDisplay('0');
    } else {
      handleCardAmountChange(quickAmount.toString());
      setCashAmount('0');
      setCashAmountDisplay('0');
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
    
    // ⚡ OPTIMISTIC UPDATE: Agar to'liq to'langan bo'lsa, DARHOL faol ro'yxatdan olib tashlash
    if (isFullyPaid) {
      console.log('⚡ OPTIMISTIC: Mashina to\'liq to\'landi - DARHOL faol ro\'yxatdan olib tashlanmoqda...');
      
      // INSTANT: Custom event dispatch (mashina DARHOL yo'qoladi)
      window.dispatchEvent(new CustomEvent('car-fully-paid', { detail: { carId: car._id } }));
    } else {
      // ⚡ Qisman to'lovda ham refresh kerak (paidAmount yangilandi)
      console.log('⚡ OPTIMISTIC: Qisman to\'lov - ma\'lumotlar yangilanmoqda...');
      window.dispatchEvent(new CustomEvent('cars-refresh'));
    }
    
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

        // To'lovlarni parallel yuborish
        if (serviceToUse) {
          console.log('🔵 To\'lovlarni parallel yuborish boshlandi');
          
          const paymentPromises = [];
          
          // Naqd to'lov
          if (cash > 0) {
            paymentPromises.push(
              api.post(`/car-services/${serviceToUse._id}/payment`, {
                amount: cash,
                paymentMethod: 'cash',
                notes: t('Naqd', language)
              }).then(() => console.log(`💵 Naqd to'lov qo'shildi: ${cash} so'm`))
            );
          }
          
          // Plastik to'lov
          if (card > 0) {
            paymentPromises.push(
              api.post(`/car-services/${serviceToUse._id}/payment`, {
                amount: card,
                paymentMethod: 'card',
                notes: t('Plastik', language)
              }).then(() => console.log(`💳 Plastik to'lov qo'shildi: ${card} so'm`))
            );
          }
          
          // Barcha to'lovlarni parallel yuborish
          await Promise.all(paymentPromises);
          console.log('✅ To\'lovlar muvaffaqiyatli saqlandi');
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
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-2 sm:mx-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 rounded-t-xl">
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
          <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
            <div className="text-xs text-gray-600 mb-0.5">{t('Qolgan summa', language)}</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(remaining)}</div>
          </div>

          {/* Naqd to'lov */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              💵 {t("Naqd", language)}
            </label>
            <input
              type="text"
              value={cashAmountDisplay}
              onChange={(e) => handleCashAmountChange(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 transition-all text-base font-semibold"
              placeholder="0"
            />
            
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={() => handleQuickAmount(50, 'cash')} className="flex-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded font-medium transition-colors">
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'cash')} className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded font-medium hover:shadow transition-all">
                {t("To'liq", language)}
              </button>
            </div>
          </div>

          {/* Plastik to'lov */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              💳 {t("Plastik", language)}
            </label>
            <input
              type="text"
              value={cardAmountDisplay}
              onChange={(e) => handleCardAmountChange(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-all text-base font-semibold"
              placeholder="0"
            />
            
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={() => handleQuickAmount(50, 'card')} className="flex-1 px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded font-medium transition-colors">
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'card')} className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded font-medium hover:shadow transition-all">
                {t("To'liq", language)}
              </button>
            </div>
            
            {errors.payment && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.payment}
              </p>
            )}
          </div>

          {/* Jami to'lov */}
          {totalPaymentAmount > 0 && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{t("Jami to'lov", language)}:</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalPaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{t("Qoladi", language)}:</span>
                <span className="font-bold text-red-600">{formatCurrency(remaining - totalPaymentAmount)}</span>
              </div>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg transition-all"
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