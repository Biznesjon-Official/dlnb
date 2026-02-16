/**
 * useApprenticesNew - Ultra Fast Apprentices Hook
 * 
 * Avtomobillar kabi instant loading va optimallashtirilgan
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User } from '@/types';

export function useApprenticesNew() {
  // ⚡ INSTANT LOADING: Initial state bo'sh array
  const [apprentices, setApprentices] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true); // Initial load uchun true
  const [error, setError] = useState<string | null>(null);

  // Load apprentices - ULTRA OPTIMIZED
  const loadApprentices = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      // API'dan ma'lumot olish
      const response = await api.get('/auth/apprentices/stats');
      const data = response.data.users || [];
      
      // State'ni yangilash
      setApprentices(data);
      
      // ⚡ INSTANT: Save to localStorage for next page load (0ms)
      try {
        localStorage.setItem('apprentices_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache apprentices to localStorage:', err);
      }
    } catch (err: any) {
      console.error('Failed to load apprentices:', err);
      setError(err.message);
      // Xatolik bo'lsa, cache'dan yuklash
      try {
        const cached = localStorage.getItem('apprentices_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setApprentices(parsed.data || []);
        }
      } catch (cacheErr) {
        console.error('Failed to load from cache:', cacheErr);
      }
    } finally {
      // Har doim loading'ni false qilish
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadApprentices(false); // Har doim loading true bilan boshlash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Faqat mount'da ishga tushsin

  // Refresh
  const refresh = useCallback(async () => {
    await loadApprentices(true); // silent reload
  }, [loadApprentices]);

  // Create apprentice - OPTIMISTIC UPDATE (instant UI)
  const createApprentice = useCallback(async (apprenticeData: any) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update with temp apprentice
      const tempApprentice = {
        ...apprenticeData,
        _id: `temp_${Date.now()}_optimistic`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalEarnings: 0,
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          approvedTasks: 0,
          inProgressTasks: 0,
          assignedTasks: 0,
          rejectedTasks: 0,
          performance: 0,
          awards: 0
        }
      };
      
      // Darhol UI'ga qo'shish
      setApprentices(prev => [tempApprentice, ...prev]);
      
      // OPTIMIZATION 2: Fire and forget - background'da yaratish
      api.post('/auth/register', apprenticeData).then((response) => {
        const newApprentice = response.data.user;
        
        // Temp'ni real ma'lumot bilan almashtirish
        setApprentices(prev => prev.map(app => 
          app._id === tempApprentice._id ? {
            ...newApprentice,
            stats: {
              totalTasks: 0,
              completedTasks: 0,
              approvedTasks: 0,
              inProgressTasks: 0,
              assignedTasks: 0,
              rejectedTasks: 0,
              performance: 0,
              awards: 0
            }
          } : app
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = [
              {
                ...newApprentice,
                stats: {
                  totalTasks: 0,
                  completedTasks: 0,
                  approvedTasks: 0,
                  inProgressTasks: 0,
                  assignedTasks: 0,
                  rejectedTasks: 0,
                  performance: 0,
                  awards: 0
                }
              },
              ...parsed.data.filter((a: any) => a._id !== tempApprentice._id)
            ];
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to create apprentice:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        // Xatolik bo'lsa, temp'ni olib tashlash va xabar ko'rsatish
        setApprentices(prev => prev.filter(app => app._id !== tempApprentice._id));
        
        // Backend'dan kelgan xatolik xabarini ko'rsatish
        const errorMessage = err.response?.data?.message || 'Shogird yaratilmadi';
        toast.error(`❌ Xatolik: ${errorMessage}`);
      });
      
      return tempApprentice; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to create apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, []);

  // Delete apprentice - OPTIMISTIC UPDATE (instant UI)
  const deleteApprentice = useCallback(async (apprenticeId: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - darhol o'chirish
      const deletedApprentice = apprentices.find(a => a._id === apprenticeId);
      setApprentices(prev => prev.filter(app => app._id !== apprenticeId));
      
      // OPTIMIZATION 2: Fire and forget - background'da o'chirish
      api.delete(`/auth/users/${apprenticeId}`).then(() => {
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.filter((a: any) => a._id !== apprenticeId);
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to delete apprentice:', err);
        // Xatolik bo'lsa, qaytarib qo'yish va xabar ko'rsatish
        if (deletedApprentice) {
          setApprentices(prev => [deletedApprentice, ...prev]);
          toast.error('❌ Xatolik: Shogird o\'chirilmadi');
        }
      });
      
      return true; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to delete apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, [apprentices]);

  // Update apprentice - OPTIMISTIC UPDATE (instant UI)
  const updateApprentice = useCallback(async (apprenticeId: string, updateData: any) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - darhol yangilash
      const oldApprentice = apprentices.find(a => a._id === apprenticeId);
      setApprentices(prev => prev.map(app => 
        app._id === apprenticeId ? { ...app, ...updateData } : app
      ));
      
      // OPTIMIZATION 2: Fire and forget - background'da yangilash
      api.patch(`/auth/users/${apprenticeId}`, updateData).then((response) => {
        const updatedApprentice = response.data.user;
        
        // Real ma'lumot bilan yangilash
        setApprentices(prev => prev.map(app => 
          app._id === apprenticeId ? { ...app, ...updatedApprentice } : app
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.map((a: any) => 
              a._id === apprenticeId ? { ...a, ...updatedApprentice } : a
            );
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to update apprentice:', err);
        // Xatolik bo'lsa, eski ma'lumotga qaytarish va xabar ko'rsatish
        if (oldApprentice) {
          setApprentices(prev => prev.map(app => 
            app._id === apprenticeId ? oldApprentice : app
          ));
          toast.error('❌ Xatolik: Shogird yangilanmadi');
        }
      });
      
      return true; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to update apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, [apprentices]);

  return {
    apprentices,
    loading,
    error,
    refresh,
    createApprentice,
    deleteApprentice,
    updateApprentice
  };
}
