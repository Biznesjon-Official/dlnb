/**
 * useCarsNew - Simplified Cars Hook using Repository Pattern
 * 
 * Bu hook yangi repository pattern'dan foydalanadi
 * Eski useCarsHybrid'dan ancha sodda va tushunarli
 */

import { useState, useEffect, useCallback } from 'react';
import { carsRepository } from '@/lib/repositories/CarsRepository';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { QueueManager } from '@/lib/sync/QueueManager';
import { SyncManager } from '@/lib/sync/SyncManager';
import { Car } from '@/lib/types/base';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export function useCarsNew() {
  // ⚡ INSTANT LOADING: Initial state bo'sh array (cache ishlatmaymiz)
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true); // Initial load uchun true
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const networkManager = NetworkManager.getInstance();
  const queueManager = QueueManager.getInstance();
  const syncManager = SyncManager.getInstance();

  // Load cars - ULTRA FAST (1 soniyadan kam)
  const loadCars = useCallback(async (silent = false) => {
    try {
      const startTime = Date.now();
      
      // Show loading faqat initial load'da
      if (!silent) {
        setLoading(true);
      }
      
      setError(null);
      
      // ⚡ DIRECT API CALL: Repository'siz to'g'ridan-to'g'ri API'ga murojaat
      const networkStatus = networkManager.getStatus();
      
      if (networkStatus.isOnline) {
        // ONLINE: Server'dan yuklash (ULTRA FAST)
        const response = await api.get('/cars');
        const data = response.data.cars || [];
        
        const duration = Date.now() - startTime;
        console.log(`⚡ Loaded ${data.length} cars in ${duration}ms`);
        
        setCars(data);
        setLoading(false);
      } else {
        // OFFLINE: IndexedDB'dan yuklash
        const data = await carsRepository.getActiveCars();
        
        const duration = Date.now() - startTime;
        console.log(`📦 Loaded ${data.length} cars from IndexedDB in ${duration}ms`);
        
        setCars(data);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to load cars:', err);
      setError(err.message);
      setCars([]);
      setLoading(false);
    }
  }, [networkManager]);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await queueManager.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Failed to get pending count:', err);
    }
  }, [queueManager]);

  // Network status listener - INSTANT REFRESH on network change (0.1s)
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    
    const unsubscribe = networkManager.onStatusChange(async (status) => {
      const wasOffline = !isOnline;
      const wasOnline = isOnline;
      setIsOnline(status.isOnline);
      
      // Clear any pending refresh
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // OFFLINE → ONLINE: INSTANT refresh (100ms)
      if (status.isOnline && wasOffline) {
        // 1. Pending count'ni darhol yangilash
        updatePendingCount();
        
        // 2. 100ms kutib INSTANT refresh (0.1 soniya)
        refreshTimeout = setTimeout(async () => {
          await loadCars(true); // silent reload, no loading spinner
          updatePendingCount();
        }, 100); // 0.1 second - INSTANT!
        
        // 3. Sync avtomatik boshlanadi (SyncManager ichida)
        // 4. Sync tugagandan keyin yana refresh bo'ladi (syncManager.onSyncComplete orqali)
      }
      
      // ONLINE → OFFLINE: INSTANT refresh (100ms)
      if (!status.isOnline && wasOnline) {
        // 100ms kutib INSTANT refresh
        refreshTimeout = setTimeout(async () => {
          await loadCars(true); // silent reload, no loading spinner
          updatePendingCount();
        }, 100); // 0.1 second - INSTANT!
      }
    });

    return () => {
      unsubscribe();
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [networkManager, isOnline, updatePendingCount, loadCars]);

  // Sync listener - listen to sync results
  useEffect(() => {
    const unsubscribe = syncManager.onSyncComplete((result) => {
      setIsSyncing(false);
      
      if (result.success > 0 || result.failed > 0) {
        // BACKGROUND'da reload (sezilmasin, loading ko'rsatmaslik)
        loadCars(true); // true = background refresh, no loading spinner
        updatePendingCount();
      }
    });

    return unsubscribe;
  }, [syncManager, loadCars, updatePendingCount]);

  // Initial load
  useEffect(() => {
    loadCars(); // Initial load
    updatePendingCount();
    
    // ⚡ Custom event listener (to'lov qo'shilganda) - INSTANT yangilash
    const handleCarsRefresh = () => {
      console.log('🔄 Custom event: cars-refresh - INSTANT yangilanmoqda...');
      // INSTANT yangilash (0ms kutish yo'q!)
      loadCars(true).then(() => {
        console.log('✅ cars-refresh: Ma\'lumotlar yangilandi');
      });
      updatePendingCount();
    };
    
    // ⚡ OPTIMISTIC UPDATE: To'lov qilingan mashina DARHOL yo'qoladi (to'liq yoki qisman farqi yo'q)
    const handleCarPaymentAdded = (event: any) => {
      const carId = event.detail?.carId;
      if (!carId) return;
      
      console.log('⚡ OPTIMISTIC: Mashinaga to\'lov qilindi - DARHOL olib tashlanmoqda:', carId);
      
      // INSTANT: Mashinani faol ro'yxatdan olib tashlash (0ms)
      setCars(prev => {
        const filtered = prev.filter(car => car._id !== carId);
        console.log('📊 After optimistic remove:', {
          before: prev.length,
          after: filtered.length,
          removedCarId: carId
        });
        return filtered;
      });
    };
    
    // ⚡ Sahifaga qaytganda avtomatik refresh (visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Sahifa ko\'rinmoqda - INSTANT refresh...');
        // INSTANT refresh (0ms kutish yo'q!)
        loadCars(true).then(() => {
          console.log('✅ Visibility change: Ma\'lumotlar yangilandi');
        });
        updatePendingCount();
      }
    };
    
    // ⚡ Focus event listener (sahifaga qaytganda)
    const handleFocus = () => {
      console.log('🎯 Sahifa focus oldi - INSTANT refresh...');
      // INSTANT refresh (0ms kutish yo'q!)
      loadCars(true).then(() => {
        console.log('✅ Focus: Ma\'lumotlar yangilandi');
      });
      updatePendingCount();
    };
    
    window.addEventListener('cars-refresh', handleCarsRefresh);
    window.addEventListener('car-payment-added', handleCarPaymentAdded as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('cars-refresh', handleCarsRefresh);
      window.removeEventListener('car-payment-added', handleCarPaymentAdded as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadCars, updatePendingCount]);

  // Create car - OPTIMIZED (instant UI update, silent)
  const createCar = useCallback(async (carData: Omit<Car, '_id'>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update with temp car
      const tempCar: Car = {
        ...carData,
        _id: `temp_${Date.now()}_optimistic`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        parts: carData.parts || [],
        serviceItems: carData.serviceItems || [],
        totalEstimate: carData.totalEstimate || 0,
        paidAmount: carData.paidAmount || 0
      } as Car;
      
      setCars(prev => [tempCar, ...prev]);
      
      // OPTIMIZATION 2: Fire and forget for non-critical operations
      carsRepository.create(carData).then((newCar) => {
        // Replace temp with real car
        setCars(prev => prev.map(car => 
          car._id === tempCar._id ? newCar : car
        ));
        updatePendingCount();
      }).catch(err => {
        console.error('Failed to create car:', err);
        // Remove temp car on error
        setCars(prev => prev.filter(car => car._id !== tempCar._id));
        toast.error(`Xatolik: ${err.message}`);
      });
      
      return tempCar; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to create car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Update car - OPTIMIZED (instant UI update, silent)
  const updateCar = useCallback(async (id: string, carData: Partial<Car>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update
      setCars(prev => prev.map(car => 
        car._id === id ? { ...car, ...carData, _pending: !isOnline } : car
      ));
      
      // OPTIMIZATION 2: Fire and forget for non-critical operations
      carsRepository.update(id, carData).then((updatedCar) => {
        // Real data bilan yangilash
        setCars(prev => prev.map(car => car._id === id ? updatedCar : car));
        updatePendingCount();
      }).catch(err => {
        console.error('Failed to update car:', err);
        // Rollback on error
        loadCars(true); // silent reload
      });
      
      return carData as Car; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to update car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Delete car - OPTIMIZED (instant UI update, silent)
  const deleteCar = useCallback(async (id: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update (no await) - faqat faol ro'yxatdan olib tashlash
      setCars(prev => prev.filter(car => car._id !== id));
      
      // OPTIMIZATION 2: Soft delete - arxivga o'tkazish
      if (isOnline && !id.startsWith('temp_')) {
        // Online: Server'ga soft delete so'rovi yuborish
        api.delete(`/cars/${id}`).then(() => {
          updatePendingCount();
        }).catch((err: any) => {
          console.error('Failed to delete car:', err);
          // Rollback on error
          loadCars(true); // silent reload
        });
      } else {
        // Offline yoki temp: IndexedDB'da soft delete
        carsRepository.update(id, { 
          isDeleted: true, 
          deletedAt: new Date().toISOString() 
        }).then(() => {
          updatePendingCount();
        }).catch((err: any) => {
          console.error('Failed to delete car:', err);
          loadCars(true);
        });
      }
    } catch (err: any) {
      console.error('Failed to delete car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Restore car - OPTIMIZED (instant UI update, silent)
  const restoreCar = useCallback(async (id: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - arxivdan faol ro'yxatga qaytarish
      // Faqat isDeleted mashinalarni qaytarish mumkin
      setCars(prev => prev.map(car => 
        car._id === id ? { 
          ...car, 
          isDeleted: false, 
          deletedAt: undefined,
          _pending: !isOnline 
        } : car
      ));
      
      // OPTIMIZATION 2: Backend'ga restore so'rovi yuborish
      if (isOnline && !id.startsWith('temp_')) {
        // Online: Server'ga restore so'rovi yuborish
        api.post(`/cars/${id}/restore`).then(() => {
          updatePendingCount();
          toast.success('✅ Mashina muvaffaqiyatli qaytarildi');
          // Background'da yangilash
          loadCars(true);
        }).catch((err: any) => {
          console.error('Failed to restore car:', err);
          const errorMsg = err.response?.data?.message || err.message;
          toast.error(`Xatolik: ${errorMsg}`);
          // Rollback on error
          loadCars(true); // silent reload
        });
      } else {
        // Offline yoki temp: IndexedDB'da restore
        carsRepository.update(id, { 
          isDeleted: false,
          deletedAt: undefined
        }).then(() => {
          updatePendingCount();
          toast.success('✅ Mashina muvaffaqiyatli qaytarildi (offline)');
        }).catch((err: any) => {
          console.error('Failed to restore car:', err);
          toast.error(`Xatolik: ${err.message}`);
          loadCars(true);
        });
      }
    } catch (err: any) {
      console.error('Failed to restore car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadCars();
    await updatePendingCount();
  }, [loadCars, updatePendingCount]);

  // Force sync now
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('❌ Offline - sync qilib bo\'lmaydi');
      return;
    }

    if (isSyncing) {
      toast.error('⏳ Sync jarayonda...');
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading('🔄 Sync boshlanmoqda...', { id: 'sync' });
      
      const result = await syncManager.forceSyncNow();
      
      toast.dismiss('sync');
      
      if (result.success > 0) {
        toast.success(`✅ ${result.success} ta vazifa bajarildi`);
      } else if (result.failed > 0) {
        toast.error(`❌ ${result.failed} ta vazifa bajarilmadi`);
      } else {
        toast.success('✅ Barcha vazifalar bajarilgan');
      }
      
      await loadCars(true); // Background refresh
      await updatePendingCount();
    } catch (err: any) {
      console.error('Sync failed:', err);
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncManager, loadCars, updatePendingCount]);

  return {
    cars,
    loading,
    error,
    isOnline,
    pendingCount,
    isSyncing,
    createCar,
    updateCar,
    deleteCar,
    restoreCar,
    refresh,
    syncNow,
    getArchivedCars: () => carsRepository.getArchivedCars()
  };
}
