import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Customer, CustomerStats, CustomerDetails } from '../types';

// Barcha mijozlarni olish
export const useCustomers = () => {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
    staleTime: 30000, // 30 soniya
  });
};

// Mijozlar statistikasi
export const useCustomersStats = () => {
  return useQuery<CustomerStats>({
    queryKey: ['customers', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/customers/stats');
      return data;
    },
    staleTime: 60000, // 1 daqiqa
  });
};

// Bitta mijoz (detalli)
export const useCustomerDetails = (customerId: string | null) => {
  return useQuery<CustomerDetails>({
    queryKey: ['customers', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');
      const { data } = await api.get(`/customers/${customerId}`);
      return data;
    },
    enabled: !!customerId,
    staleTime: 30000,
  });
};
