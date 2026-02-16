/**
 * useDebtsNew - Ultra Fast Debts Hook
 * 
 * Shogirtlar va Bookings kabi instant loading va optimallashtirilgan
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Debt {
  _id: string;
  creditorName: string;
  creditorPhone?: string;
  amount: number;
  paidAmount: number;
  type: 'receivable' | 'payable';
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  description?: string;
  paymentHistory?: Array<{
    amount: number;
    date: string;
    notes?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DebtSummary {
  receivables: {
    total: number;
    remaining: number;
    count: number;
  };
  payables: {
    total: number;
    remaining: number;
    count: number;
  };
  netPosition: number;
}

export function useDebtsNew(filters?: { type?: string; status?: string }) {
  // ⚡ INSTANT LOADING: Initial state bo'sh array
  const [debts, setDebts] = useState<Debt[]>([]);

  const [summary, setSummary] = useState<DebtSummary>({
    receivables: { total: 0, remaining: 0, count: 0 },
    payables: { total: 0, remaining: 0, count: 0 },
    netPosition: 0
  });
  
  const [loading, setLoading] = useState(true); // Initial load uchun true
  const [summaryLoading, setSummaryLoading] = useState(true); // Initial load uchun true
  const [error, setError] = useState<string | null>(null);

  // Load debts - ULTRA OPTIMIZED
  const loadDebts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      // API'dan ma'lumot olish
      const response = await api.get(`/debts?${params.toString()}`);
      const data = response.data.debts || [];
      
      // State'ni yangilash
      setDebts(data);
      
      // ⚡ INSTANT: Save to localStorage
      try {
        localStorage.setItem('debts_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache debts:', err);
      }
    } catch (err: any) {
      console.error('Failed to load debts:', err);
      setError(err.message);
      // Xatolik bo'lsa, cache'dan yuklash
      try {
        const cached = localStorage.getItem('debts_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setDebts(parsed.data || []);
        }
      } catch (cacheErr) {
        console.error('Failed to load from cache:', cacheErr);
      }
    } finally {
      // Har doim loading'ni false qilish
      setLoading(false);
    }
  }, [filters]);

  // Load summary - ULTRA OPTIMIZED
  const loadSummary = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setSummaryLoading(true);
      }
      
      const response = await api.get('/debts/summary');
      const data = response.data;
      
      setSummary(data);
      
      // ⚡ INSTANT: Save to localStorage
      try {
        localStorage.setItem('debts_summary_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache summary:', err);
      }
    } catch (err: any) {
      console.error('Failed to load summary:', err);
      // Xatolik bo'lsa, cache'dan yuklash
      try {
        const cached = localStorage.getItem('debts_summary_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSummary(parsed.data);
        }
      } catch (cacheErr) {
        console.error('Failed to load summary from cache:', cacheErr);
      }
    } finally {
      // Har doim loading'ni false qilish
      setSummaryLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDebts(false); // Har doim loading true bilan boshlash
    loadSummary(false); // Har doim loading true bilan boshlash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Faqat mount'da ishga tushsin

  // Filters o'zgarganda qayta yuklash
  useEffect(() => {
    if (filters?.type || filters?.status) {
      loadDebts(true); // Silent reload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.type, filters?.status]);

  // Refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      loadDebts(true),
      loadSummary(true)
    ]);
  }, [loadDebts, loadSummary]);

  // Update debt - OPTIMISTIC UPDATE
  const updateDebt = useCallback(async (debtId: string, updateData: any) => {
    try {
      const oldDebt = debts.find(d => d._id === debtId);
      
      // ⚡ INSTANT: Darhol UI'ni yangilash
      setDebts(prev => prev.map(d => 
        d._id === debtId ? { ...d, ...updateData } : d
      ));
      
      // Background'da yangilash
      api.put(`/debts/${debtId}`, updateData).then((response) => {
        const updatedDebt = response.data.debt;
        
        // Real ma'lumot bilan yangilash
        setDebts(prev => prev.map(d => 
          d._id === debtId ? updatedDebt : d
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('debts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.map((d: any) => 
              d._id === debtId ? updatedDebt : d
            );
            localStorage.setItem('debts_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        // Summary'ni yangilash
        loadSummary(true);
      }).catch(err => {
        console.error('Failed to update debt:', err);
        // Xatolik bo'lsa, eski ma'lumotga qaytarish
        if (oldDebt) {
          setDebts(prev => prev.map(d => 
            d._id === debtId ? oldDebt : d
          ));
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to update debt:', err);
      throw err;
    }
  }, [debts, loadSummary]);

  // Delete debt - OPTIMISTIC UPDATE
  const deleteDebt = useCallback(async (debtId: string) => {
    try {
      const deletedDebt = debts.find(d => d._id === debtId);
      
      // ⚡ INSTANT: Darhol UI'dan o'chirish
      setDebts(prev => prev.filter(d => d._id !== debtId));
      
      // Background'da o'chirish
      api.delete(`/debts/${debtId}`).then(() => {
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('debts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.filter((d: any) => d._id !== debtId);
            localStorage.setItem('debts_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        // Summary'ni yangilash
        loadSummary(true);
      }).catch(err => {
        console.error('Failed to delete debt:', err);
        // Xatolik bo'lsa, qaytarib qo'yish
        if (deletedDebt) {
          setDebts(prev => [deletedDebt, ...prev]);
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to delete debt:', err);
      throw err;
    }
  }, [debts, loadSummary]);

  // Add payment - OPTIMISTIC UPDATE
  const addPayment = useCallback(async (debtId: string, amount: number, notes?: string) => {
    try {
      const oldDebt = debts.find(d => d._id === debtId);
      if (!oldDebt) return false;
      
      // Calculate new values
      const newPaidAmount = oldDebt.paidAmount + amount;
      const newStatus = newPaidAmount >= oldDebt.amount ? 'paid' : 
                       newPaidAmount > 0 ? 'partial' : 'pending';
      
      const newPayment = {
        amount,
        date: new Date().toISOString(),
        notes
      };
      
      // ⚡ INSTANT: Darhol UI'ni yangilash
      setDebts(prev => prev.map(d => 
        d._id === debtId ? {
          ...d,
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentHistory: [...(d.paymentHistory || []), newPayment]
        } : d
      ));
      
      // Background'da qo'shish
      api.post(`/debts/${debtId}/payments`, { amount, notes }).then((response) => {
        const updatedDebt = response.data.debt;
        
        // Real ma'lumot bilan yangilash
        setDebts(prev => prev.map(d => 
          d._id === debtId ? updatedDebt : d
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('debts_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.map((d: any) => 
              d._id === debtId ? updatedDebt : d
            );
            localStorage.setItem('debts_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
        
        // Summary'ni yangilash
        loadSummary(true);
      }).catch(err => {
        console.error('Failed to add payment:', err);
        // Xatolik bo'lsa, eski ma'lumotga qaytarish
        if (oldDebt) {
          setDebts(prev => prev.map(d => 
            d._id === debtId ? oldDebt : d
          ));
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to add payment:', err);
      throw err;
    }
  }, [debts, loadSummary]);

  return {
    debts,
    summary,
    loading,
    summaryLoading,
    error,
    refresh,
    updateDebt,
    deleteDebt,
    addPayment
  };
}
