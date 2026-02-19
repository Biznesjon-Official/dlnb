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
  // ⚡ STATE: Server'dan olingan ma'lumotlar (cache yo'q)
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load spare parts - CACHE YO'Q (har doim server'dan)
  const loadSpareParts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true); // Loading'ni yoqish
        console.log('🔄 Loading spare parts... (loading = true)');
      }
      setError(null);
      
      // Backend'dan yuklash (cache bypass)
      const timestamp = Date.now();
      const response = await api.get(`/spare-parts?_t=${timestamp}`);
      const data = response.data.spareParts || [];
      
      // Faqat valid ma'lumotlarni saqlash
      const validData = data.filter((part: any) => part && part._id);
      setSpareParts(validData);
      
      console.log(`✅ Loaded ${validData.length} spare parts`);
      
    } catch (err: any) {
      console.error('Failed to load spare parts:', err);
      setError(err.message);
    } finally {
      if (!silent) {
        setLoading(false); // Loading'ni o'chirish
        console.log('✅ Loading complete (loading = false)');
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSpareParts(false); // Loading spinner bilan yuklash
  }, [loadSpareParts]);

  // Create spare part - OPTIMIZED (instant UI update, cache yo'q)
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
      
      setSpareParts(prev => [tempPart, ...prev.filter(p => p && p._id)]);
      
      // OPTIMIZATION 2: Fire and forget - background'da saqlash
      api.post('/spare-parts', sparePartData).then((response) => {
        const realPart = response.data.sparePart || response.data;
        
        if (realPart && realPart._id) {
          // Replace temp with real part
          setSpareParts(prev => prev.map(part => 
            part && part._id === tempPart._id ? realPart : part
          ).filter(p => p && p._id));
        }
        
        toast.success('Zapchast muvaffaqiyatli yaratildi');
      }).catch(err => {
        console.error('Failed to create spare part:', err);
        // Remove temp part on error
        setSpareParts(prev => prev.filter(part => part && part._id !== tempPart._id));
        toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
      });
      
      return tempPart; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to create spare part:', err);
      toast.error(`Xatolik: ${err.message}`);
      throw err;
    }
  }, []);

  // Update spare part - OPTIMIZED (instant UI update, cache yo'q)
  const updateSparePart = useCallback(async (id: string, sparePartData: Partial<SparePart>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update
      setSpareParts(prev => prev.map(part => 
        part && part._id === id ? { ...part, ...sparePartData, updatedAt: new Date().toISOString() } : part
      ).filter(p => p && p._id));
      
      // OPTIMIZATION 2: Fire and forget - background'da saqlash
      api.put(`/spare-parts/${id}`, sparePartData).then((response) => {
        const updatedPart = response.data.sparePart || response.data;
        
        if (updatedPart && updatedPart._id) {
          // Real data bilan yangilash
          setSpareParts(prev => prev.map(part => 
            part && part._id === id ? updatedPart : part
          ).filter(p => p && p._id));
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

  // Delete spare part - OPTIMIZED (instant UI update, cache yo'q)
  const deleteSparePart = useCallback(async (id: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - faqat faol ro'yxatdan olib tashlash
      const updatedParts = spareParts.filter(part => part && part._id && part._id !== id);
      setSpareParts(updatedParts);
      
      // OPTIMIZATION 2: Backend'ga o'chirish so'rovi yuborish
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

  // Sell spare part - OPTIMIZED (instant UI update, cache yo'q)
  const sellSparePart = useCallback(async (id: string, quantity: number, sellingPrice?: number) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - miqdorni kamaytirish
      setSpareParts(prev => prev.map(part => 
        part && part._id === id ? { ...part, quantity: Math.max(0, part.quantity - quantity) } : part
      ).filter(part => part && part._id)); // undefined'larni olib tashlash
      
      // OPTIMIZATION 2: Backend'ga sotish so'rovi yuborish
      const response = await api.post('/spare-parts/sell', {
        sparePartId: id,
        quantity,
        sellingPrice
      });
      
      // OPTIMIZATION 3: Backend'dan yangi ma'lumotlarni olish
      const updatedPart = response.data.sparePart;
      
      // Agar updatedPart mavjud bo'lsa, UI'ni real ma'lumotlar bilan yangilash
      if (updatedPart && updatedPart._id) {
        setSpareParts(prev => prev.map(part => 
          part && part._id === id ? updatedPart : part
        ).filter(part => part && part._id)); // undefined'larni olib tashlash
      } else {
        // Agar updatedPart yo'q bo'lsa, server'dan qayta yuklash
        console.warn('Updated part not found in response, reloading...');
        await loadSpareParts(true);
      }
      
      toast.success('Zapchast muvaffaqiyatli sotildi');
      
      // OPTIMIZATION 4: Sahifani yangilash uchun signal qaytarish
      return updatedPart;
    } catch (err: any) {
      console.error('Failed to sell spare part:', err);
      // Rollback on error
      loadSpareParts(true);
      toast.error(`Xatolik: ${err.response?.data?.message || err.message}`);
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
    loadSpareParts,
    refetch: () => loadSpareParts(false) // Yangilash funksiyasi
  };
}
