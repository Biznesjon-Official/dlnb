/**
 * useSparePartsNew - Simplified Spare Parts Hook (Cars kabi)
 * 
 * Bu hook useCarsNew'dan ilhomlangan
 * localStorage + Optimistic Updates
 */

import { useState, useEffect, useCallback } from 'react';
import { SparePart } from '@/types';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export function useSparePartsNew() {
  // ⚡ INSTANT LOADING: Initial state'ni localStorage'dan olish (0ms)
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    try {
      const cached = localStorage.getItem('spare_parts_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache 24 soat amal qiladi
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data || [];
        }
      }
    } catch (err) {
      console.error('Failed to load spare parts from localStorage:', err);
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load spare parts - ULTRA OPTIMIZED (instant loading)
  const loadSpareParts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      // Backend'dan yuklash
      const response = await api.get('/spare-parts');
      const data = response.data.spareParts || [];
      
      setSpareParts(data);
      
      // ⚡ INSTANT: Save to localStorage for next page load (0ms)
      try {
        localStorage.setItem('spare_parts_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache spare parts to localStorage:', err);
      }
    } catch (err: any) {
      console.error('Failed to load spare parts:', err);
      setError(err.message);
      
      // Fallback: localStorage'dan yuklash (offline bo'lsa)
      try {
        const cached = localStorage.getItem('spare_parts_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setSpareParts(parsed.data || []);
          }
        }
      } catch (cacheErr) {
        console.error('Failed to load from cache:', cacheErr);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSpareParts(false); // Loading spinner bilan yuklash
  }, [loadSpareParts]);

  // Create spare part - OPTIMIZED (instant UI update)
  const createSparePart = useCallback(async (sparePartData: any) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update with temp part
      const tempPart: SparePart = {
        ...sparePartData,
        _id: `temp_${Date.now()}_optimistic`,
        usageCount: 0,
        isActive: true,
        profit: (sparePartData.sellingPrice || 0) - (sparePartData.costPrice || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSpareParts(prev => [tempPart, ...prev]);
      
      // OPTIMIZATION 2: Fire and forget - background'da saqlash
      api.post('/spare-parts', sparePartData).then((response) => {
        const realPart = response.data.sparePart || response.data;
        
        // Replace temp with real part
        setSpareParts(prev => prev.map(part => 
          part._id === tempPart._id ? realPart : part
        ));
        
        // Update localStorage
        try {
          const cached = localStorage.getItem('spare_parts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.data = parsed.data.map((p: SparePart) => 
              p._id === tempPart._id ? realPart : p
            );
            localStorage.setItem('spare_parts_cache', JSON.stringify(parsed));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        toast.success('Zapchast muvaffaqiyatli yaratildi');
      }).catch(err => {
        console.error('Failed to create spare part:', err);
        // Remove temp part on error
        setSpareParts(prev => prev.filter(part => part._id !== tempPart._id));
        toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
      });
      
      return tempPart; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to create spare part:', err);
      toast.error(`Xatolik: ${err.message}`);
      throw err;
    }
  }, []);

  // Update spare part - OPTIMIZED (instant UI update)
  const updateSparePart = useCallback(async (id: string, sparePartData: Partial<SparePart>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update
      setSpareParts(prev => prev.map(part => 
        part._id === id ? { ...part, ...sparePartData, updatedAt: new Date().toISOString() } : part
      ));
      
      // OPTIMIZATION 2: Fire and forget - background'da saqlash
      api.put(`/spare-parts/${id}`, sparePartData).then((response) => {
        const updatedPart = response.data.sparePart || response.data;
        
        // Real data bilan yangilash
        setSpareParts(prev => prev.map(part => part._id === id ? updatedPart : part));
        
        // Update localStorage
        try {
          const cached = localStorage.getItem('spare_parts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.data = parsed.data.map((p: SparePart) => 
              p._id === id ? updatedPart : p
            );
            localStorage.setItem('spare_parts_cache', JSON.stringify(parsed));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        toast.success('Zapchast muvaffaqiyatli yangilandi');
      }).catch(err => {
        console.error('Failed to update spare part:', err);
        // Rollback on error
        loadSpareParts(true);
        toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
      });
      
      return sparePartData as SparePart; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to update spare part:', err);
      toast.error(`Xatolik: ${err.message}`);
      throw err;
    }
  }, [loadSpareParts]);

  // Delete spare part - OPTIMIZED (instant UI update)
  const deleteSparePart = useCallback(async (id: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - faqat faol ro'yxatdan olib tashlash
      const updatedParts = spareParts.filter(part => part._id !== id);
      setSpareParts(updatedParts);
      
      // OPTIMIZATION 2: DARHOL localStorage'ni yangilash (sync)
      try {
        localStorage.setItem('spare_parts_cache', JSON.stringify({
          data: updatedParts,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to update cache:', err);
      }
      
      // OPTIMIZATION 3: Backend'ga o'chirish so'rovi yuborish
      await api.delete(`/spare-parts/${id}`);
      
      toast.success('Zapchast muvaffaqiyatli o\'chirildi');
    } catch (err: any) {
      console.error('Failed to delete spare part:', err);
      // Rollback on error
      loadSpareParts(true);
      toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }, [spareParts, loadSpareParts]);

  // Sell spare part - OPTIMIZED (instant UI update)
  const sellSparePart = useCallback(async (id: string, quantity: number, sellingPrice?: number) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - miqdorni kamaytirish
      setSpareParts(prev => prev.map(part => 
        part._id === id ? { ...part, quantity: part.quantity - quantity } : part
      ));
      
      // OPTIMIZATION 2: Backend'ga sotish so'rovi yuborish
      api.post('/spare-parts/sell', {
        sparePartId: id,
        quantity,
        sellingPrice
      }).then(() => {
        // Update localStorage
        try {
          const cached = localStorage.getItem('spare_parts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.data = parsed.data.map((p: SparePart) => 
              p._id === id ? { ...p, quantity: p.quantity - quantity } : p
            );
            localStorage.setItem('spare_parts_cache', JSON.stringify(parsed));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        toast.success('Zapchast muvaffaqiyatli sotildi');
      }).catch((err: any) => {
        console.error('Failed to sell spare part:', err);
        // Rollback on error
        loadSpareParts(true);
        toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
      });
    } catch (err: any) {
      console.error('Failed to sell spare part:', err);
      toast.error(`Xatolik: ${err.message}`);
      throw err;
    }
  }, [loadSpareParts]);

  return {
    spareParts,
    loading,
    error,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    sellSparePart,
    loadSpareParts
  };
}
