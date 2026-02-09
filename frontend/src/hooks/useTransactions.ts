import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TransactionFilters, TransactionResponse, TransactionSummary, Transaction } from '@/types';

// INSTANT LOADING: localStorage'dan cache'ni o'qish
const getCachedData = <T,>(key: string): T | undefined => {
  try {
    const cached = localStorage.getItem(`rq_cache_${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache 24 soat amal qiladi
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.error('Cache read error:', err);
  }
  return undefined;
};

// Cache'ni localStorage'ga saqlash
const setCachedData = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(`rq_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.error('Cache write error:', err);
  }
};

export const useTransactions = (filters: TransactionFilters = {}) => {
  const cacheKey = JSON.stringify(['transactions', filters]);
  const initialData = getCachedData<TransactionResponse>(cacheKey);
  
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionResponse> => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/transactions?${params.toString()}`);
      const data = response.data;
      
      // INSTANT LOADING: Cache'ni saqlash
      setCachedData(cacheKey, data);
      
      return data;
    },
    initialData, // INSTANT LOADING: Darhol cache'dan ko'rsatish (0.1s)
    placeholderData: (previousData) => previousData, // Har safar oldingi ma'lumotni ko'rsatish
    staleTime: 0, // Har doim yangi ma'lumot olish
    gcTime: 5 * 60 * 1000, // 5 daqiqa cache'da saqlash
    retry: 1, // 1 marta qayta urinish
    refetchOnWindowFocus: true, // Window focus bo'lganda yangilash
    refetchOnMount: true, // Mount bo'lganda yangilash
    refetchOnReconnect: true, // Reconnect bo'lganda yangilash
    notifyOnChangeProps: ['data'], // Faqat data o'zgarganda render qilish
  });
};

export const useTransactionSummary = () => {
  const cacheKey = 'transactionSummary';
  const initialData = getCachedData<{ summary: TransactionSummary }>(cacheKey);
  
  return useQuery({
    queryKey: ['transactionSummary'],
    queryFn: async (): Promise<{ summary: TransactionSummary }> => {
      console.log('🔄 Fetching transaction summary from API...');
      const response = await api.get('/transactions/summary');
      const data = response.data;
      
      console.log('📊 API Response:', data);
      console.log('👥 byUser array:', data.summary?.byUser);
      console.log('👥 byUser length:', data.summary?.byUser?.length);
      
      // INSTANT LOADING: Cache'ni saqlash
      setCachedData(cacheKey, data);
      
      return data;
    },
    initialData, // INSTANT LOADING: Darhol cache'dan ko'rsatish (0.1s)
    placeholderData: (previousData) => previousData, // Har safar oldingi ma'lumotni ko'rsatish
    staleTime: 0, // Har doim yangi ma'lumot olish
    gcTime: 5 * 60 * 1000, // 5 daqiqa cache'da saqlash
    retry: 1, // 1 marta qayta urinish
    refetchOnWindowFocus: true, // Window focus bo'lganda yangilash
    refetchOnMount: true, // Mount bo'lganda yangilash
    refetchOnReconnect: true, // Reconnect bo'lganda yangilash
    notifyOnChangeProps: ['data'], // Faqat data o'zgarganda render qilish
  });
};

export const useTransactionStats = (dateRange?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['transactionStats', dateRange],
    queryFn: async (): Promise<{ summary: TransactionSummary }> => {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await api.get(`/transactions/stats?${params.toString()}`);
      return response.data;
    },
    staleTime: 0, // Har doim yangi ma'lumot olish
    gcTime: 5 * 60 * 1000, // 5 daqiqa cache'da saqlash
    retry: 1, // 1 marta qayta urinish
    refetchOnWindowFocus: true, // Window focus bo'lganda yangilash
    refetchOnMount: true, // Mount bo'lganda yangilash
    refetchOnReconnect: true, // Reconnect bo'lganda yangilash
    enabled: !!dateRange,
    notifyOnChangeProps: ['data'],
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: Partial<Transaction>) => {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    },
    onSuccess: () => {
      // INSTANT LOADING: localStorage cache'ni tozalash
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('rq_cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.error('Cache clear error:', err);
      }
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      queryClient.invalidateQueries({ queryKey: ['apprentices'] }); // Shogirdlar ma'lumotini yangilash
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Foydalanuvchilar ma'lumotini yangilash
      // Toast xabar o'chirildi - foydalanuvchi allaqachon modal'da success ko'rgan
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya qo\'shishda xatolik');
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // INSTANT LOADING: localStorage cache'ni tozalash
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('rq_cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.error('Cache clear error:', err);
      }
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      toast.success('Tranzaksiya muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya o\'chirishda xatolik');
    },
  });
};
