import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Box,
  ArrowLeft,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useSpareParts } from '@/hooks/useSpareParts';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import CreateSparePartModal from '@/components/CreateSparePartModal';
import EditSparePartModal from '@/components/EditSparePartModal';
import DeleteSparePartModal from '@/components/DeleteSparePartModal';
import ViewSparePartModal from '@/components/ViewSparePartModal';
import SellSparePartModal from '@/components/SellSparePartModal';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const MasterWarehouse: React.FC = memo(() => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 50); // 50ms debounce - maksimal tezlik
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true); // true bilan boshlaymiz - bir vaqtda yuklanish uchun

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: sparePartsData, isLoading } = useSpareParts();

  // Umumiy loading holati - barcha statistikalar bir vaqtda
  const isAllStatsLoading = (isLoading && !sparePartsData) || isLoadingStats;

  const spareParts = useMemo(() => sparePartsData?.spareParts || [], [sparePartsData]);

  const filteredParts = useMemo(() => {
    if (!spareParts.length) return [];
    if (!debouncedSearch) return spareParts;
    
    const searchLower = debouncedSearch.toLowerCase();
    return spareParts.filter((part: any) => {
      // Nom bo'yicha qidirish
      const nameMatch = part.name.toLowerCase().includes(searchLower);
      
      // Supplier bo'yicha qidirish
      const supplierMatch = part.supplier?.toLowerCase().includes(searchLower);
      
      // Kategoriya bo'yicha qidirish
      const categoryMatch = part.category && (
        (part.category === 'balon' && ('balon'.includes(searchLower) || 'tire'.includes(searchLower))) ||
        (part.category === 'zapchast' && ('zapchast'.includes(searchLower) || 'spare'.includes(searchLower))) ||
        (part.category === 'boshqa' && ('boshqa'.includes(searchLower) || 'other'.includes(searchLower)))
      );
      
      // Balon ma'lumotlari bo'yicha qidirish
      const tireMatch = part.category === 'balon' && (
        (part.tireSize && part.tireSize.toLowerCase().includes(searchLower)) ||
        (part.tireFullSize && part.tireFullSize.toLowerCase().includes(searchLower)) ||
        (part.tireBrand && part.tireBrand.toLowerCase().includes(searchLower)) ||
        (part.tireType && part.tireType.toLowerCase().includes(searchLower))
      );
      
      return nameMatch || supplierMatch || categoryMatch || tireMatch;
    });
  }, [spareParts, debouncedSearch]);

  const lowStockParts = useMemo(() => {
    return spareParts.filter((part: any) => part.quantity <= 3);
  }, [spareParts]);

  const statistics = useMemo(() => {
    if (!spareParts.length) return {
      totalValue: 0,
      totalProfit: 0,
      totalItems: 0,
      totalQuantity: 0
    };

    return {
      totalValue: spareParts.reduce((sum: number, part: any) => 
        sum + (part.sellingPrice * part.quantity), 0),
      totalProfit: spareParts.reduce((sum: number, part: any) => 
        sum + ((part.sellingPrice - part.costPrice) * part.quantity), 0),
      totalItems: spareParts.length,
      totalQuantity: spareParts.reduce((sum: number, part: any) => 
        sum + part.quantity, 0)
    };
  }, [spareParts]);

  const handleEdit = useCallback((part: any) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((part: any) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  }, []);

  const handleView = useCallback((part: any) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  }, []);

  const handleSell = useCallback((part: any) => {
    setSelectedPart(part);
    setIsSellModalOpen(true);
  }, []);

  // Miqdorga qarab rang aniqlash
  const getStockColor = useCallback((quantity: number) => {
    if (quantity < 3) {
      return {
        card: 'border-red-500 bg-gradient-to-br from-red-100 to-pink-100 hover:border-red-600',
        badge: 'bg-gradient-to-br from-red-500 to-pink-600'
      };
    } else if (quantity >= 3 && quantity < 10) {
      return {
        card: 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 hover:border-yellow-600',
        badge: 'bg-gradient-to-br from-yellow-500 to-amber-600'
      };
    } else if (quantity >= 10 && quantity < 15) {
      return {
        card: 'border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 hover:border-blue-600',
        badge: 'bg-gradient-to-br from-blue-500 to-cyan-600'
      };
    } else {
      return {
        card: 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 hover:border-green-600',
        badge: 'bg-gradient-to-br from-green-500 to-emerald-600'
      };
    }
  }, []);

  const fetchSalesStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await api.get('/spare-parts/sales/statistics');
      setSalesStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleSellSuccess = useCallback((soldQuantity: number) => {
    setIsSellModalOpen(false);
    // Optimistic update - darhol sotilgan miqdorni kamaytirish
    if (selectedPart) {
      queryClient.setQueryData(['spare-parts', {}], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          spareParts: oldData.spareParts.map((part: any) => 
            part._id === selectedPart._id 
              ? { ...part, quantity: part.quantity - soldQuantity }
              : part
          )
        };
      });
    }
    setSelectedPart(null);
    // Background'da yangilash
    queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
    fetchSalesStats();
  }, [selectedPart, queryClient, fetchSalesStats]);

  useEffect(() => {
    fetchSalesStats();
  }, [fetchSalesStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 lg:p-4 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/app/master/cashier')}
          className="group flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">{t('Kassaga qaytish', language)}</span>
        </button>

        {/* Header Section */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10 p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative p-2 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-lg shadow-lg transform group-hover:scale-105 transition-transform">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                    {t("Ombor", language)}
                  </h1>
                  <p className="text-xs text-gray-600 font-medium">{t("Tovarlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative overflow-hidden px-3 py-1.5 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1.5 text-xs"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">{t('Tovar qo\'shish', language)}</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-2">
              {isAllStatsLoading ? (
                // Loading state - barcha kartalar bir vaqtda
                <>
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-2 border border-purple-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-purple-500 rounded">
                        <Box className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-1 py-0.5 rounded-full">
                        {t('Jami', language)}
                      </span>
                    </div>
                    <div className="h-5 w-12 bg-purple-200 animate-pulse rounded"></div>
                    <p className="text-xs text-purple-600 mt-0.5">{t('Tovar turlari', language)}</p>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-blue-500 rounded">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded-full">
                        {t('Qiymat', language)}
                      </span>
                    </div>
                    <div className="h-5 w-16 bg-blue-200 animate-pulse rounded"></div>
                    <p className="text-xs text-blue-600 mt-0.5">{t('Umumiy qiymat', language)}</p>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-2 border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-red-500 rounded">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-1 py-0.5 rounded-full">
                        {t('Ogohlantirish', language)}
                      </span>
                    </div>
                    <div className="h-5 w-8 bg-red-200 animate-pulse rounded"></div>
                    <p className="text-xs text-red-600 mt-0.5">{t('Kam qolgan', language)}</p>
                  </div>
                </>
              ) : (
                // Data loaded - barcha kartalar bir vaqtda
                <>
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-2 border border-purple-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-purple-500 rounded">
                        <Box className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-1 py-0.5 rounded-full">
                        {t('Jami', language)}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-purple-900">
                      {spareParts?.length || 0}
                    </div>
                    <p className="text-xs text-purple-600 mt-0.5">{t('Tovar turlari', language)}</p>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-blue-500 rounded">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded-full">
                        {t('Qiymat', language)}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(statistics.totalValue)}
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5">{t('Umumiy qiymat', language)}</p>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-2 border border-red-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="p-1 bg-red-500 rounded">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-1 py-0.5 rounded-full">
                        {t('Ogohlantirish', language)}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-red-900">
                      {lowStockParts.length}
                    </div>
                    <p className="text-xs text-red-600 mt-0.5">{t('Kam qolgan', language)}</p>
                  </div>
                </>
              )}
            </div>

            {/* Sales Statistics */}
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                {t('Sotuvlar statistikasi', language)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {isAllStatsLoading ? (
                  // Loading state - barcha kartalar bir vaqtda
                  <>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-green-500 rounded">
                          <Package className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-700">{t('Sotuvlar', language)}</span>
                      </div>
                      <div className="h-6 w-10 bg-green-200 animate-pulse rounded"></div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-blue-500 rounded">
                          <Box className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700">{t('Miqdor', language)}</span>
                      </div>
                      <div className="h-6 w-10 bg-blue-200 animate-pulse rounded"></div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-purple-500 rounded">
                          <DollarSign className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700">{t('Tushum', language)}</span>
                      </div>
                      <div className="h-5 w-16 bg-purple-200 animate-pulse rounded"></div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-yellow-500 rounded">
                          <TrendingUp className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-yellow-700">{t('Foyda', language)}</span>
                      </div>
                      <div className="h-5 w-16 bg-yellow-200 animate-pulse rounded"></div>
                    </div>
                  </>
                ) : (
                  // Data loaded - barcha kartalar bir vaqtda
                  <>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-green-500 rounded">
                          <Package className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-700">{t('Sotuvlar', language)}</span>
                      </div>
                      <div className="text-base font-bold text-green-900">
                        {salesStats?.totalSales || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-blue-500 rounded">
                          <Box className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700">{t('Miqdor', language)}</span>
                      </div>
                      <div className="text-base font-bold text-blue-900">
                        {salesStats?.totalQuantitySold || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-purple-500 rounded">
                          <DollarSign className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700">{t('Tushum', language)}</span>
                      </div>
                      <div className="text-xs font-bold text-purple-900">
                        {formatCurrency(salesStats?.totalRevenue || 0)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-0.5 bg-yellow-500 rounded">
                          <TrendingUp className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-yellow-700">{t('Foyda', language)}</span>
                      </div>
                      <div className="text-xs font-bold text-yellow-900">
                        {formatCurrency(salesStats?.totalProfit || 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert - O'chirildi, faqat statistika kartasida ko'rsatiladi */}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('Tovar qidirish...', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 shadow-sm text-sm"
          />
        </div>

        {/* Parts List */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100/50 p-3 sm:p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              {t("Tovarlar ro'yxati", language)}
            </h3>

            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Loading overlay - faqat birinchi yuklanishda */}
              {isLoading && !sparePartsData ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-base text-gray-600 font-medium">{t('Yuklanmoqda...', language)}</p>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50"></div>
                    <div className="relative p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-base text-gray-600 font-semibold mb-2">{t('Tovarlar yo\'q', language)}</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? t('Qidiruv natijasi topilmadi', language) : t('Tovar qo\'shing', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredParts.map((part: any) => {
                    const stockColor = getStockColor(part.quantity);
                    return (
                      <div 
                        key={part._id} 
                        className={`group relative overflow-hidden rounded-lg p-3 border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${stockColor.card}`}
                      >
                        {/* Top Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg shadow-md ${stockColor.badge}`}>
                            <Package className="h-3.5 w-3.5 text-white" />
                          </div>
                          {part.quantity <= 3 && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
                              {t('Kam qolgan!', language)}
                            </span>
                          )}
                        </div>

                      {/* Product Name */}
                      <div className="mb-2">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">
                          {part.name}
                        </h4>
                        
                        {/* Kategoriya va balon ma'lumotlari */}
                        {part.category === 'balon' && (
                          <div className="mt-2 space-y-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                              🚗 {t('Balon', language)}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {part.tireSize && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {part.tireSize}
                                </span>
                              )}
                              {part.tireFullSize && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                  {part.tireFullSize}
                                </span>
                              )}
                              {part.tireBrand && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  {part.tireBrand}
                                </span>
                              )}
                              {part.tireType && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
                                  {part.tireType === 'yozgi' ? '☀️' : part.tireType === 'qishki' ? '❄️' : '🔄'} {part.tireType}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Zapchast va boshqa kategoriyalar uchun */}
                        {(part.category === 'zapchast' || part.category === 'boshqa') && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                              {part.category === 'zapchast' ? '🔧 ' + t('Zapchast', language) : '📦 ' + t('Boshqa', language)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity & Price */}
                      <div className="space-y-1.5 mb-2">
                        <div className="flex items-center justify-between bg-white/60 rounded-lg p-1.5">
                          <span className="text-xs text-gray-600">{t('Miqdor', language)}</span>
                          <span className="text-sm font-bold text-gray-900">
                            {part.quantity} {part.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-lg p-1.5">
                          <span className="text-xs text-gray-600">{t('Narx', language)}</span>
                          <span className="text-sm font-bold text-purple-600">
                            {part.currency === 'USD' ? '$' : ''}{formatCurrency(part.sellingPrice || part.price || 0)}{part.currency === 'UZS' ? '' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-4 gap-1 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleSell(part)}
                          className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
                          title={t('Sotish', language)}
                        > 
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleView(part)}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                          title={t('Ko\'rish', language)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(part)}
                          className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center"
                          title={t('Tahrirlash', language)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                          title={t('O\'chirish', language)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSparePartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newPart) => {
          setIsCreateModalOpen(false);
          // Optimistic update - darhol yangi tovarni qo'shish
          queryClient.setQueryData(['spare-parts', {}], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              spareParts: [newPart, ...oldData.spareParts],
              pagination: {
                ...oldData.pagination,
                total: oldData.pagination.total + 1
              },
              statistics: {
                ...oldData.statistics,
                totalItems: (oldData.statistics?.totalItems || 0) + 1,
                totalQuantity: (oldData.statistics?.totalQuantity || 0) + newPart.quantity,
                totalValue: (oldData.statistics?.totalValue || 0) + (newPart.sellingPrice * newPart.quantity),
                totalProfit: (oldData.statistics?.totalProfit || 0) + ((newPart.sellingPrice - newPart.costPrice) * newPart.quantity)
              }
            };
          });
          // Background'da statistikani yangilash (sekin, lekin muhim emas)
          setTimeout(() => {
            fetchSalesStats();
          }, 500);
        }}
      />
      {selectedPart && (
        <>
          <EditSparePartModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={(updatedPart) => {
              // 1. Darhol modal'ni yopish
              setIsEditModalOpen(false);
              setSelectedPart(null);
              
              // 2. Optimistic update - DARHOL yangilash
              queryClient.setQueryData(['spare-parts', {}], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  spareParts: oldData.spareParts.map((part: any) => 
                    part._id === updatedPart._id ? { ...part, ...updatedPart } : part
                  )
                };
              });
            }}
            sparePart={selectedPart}
          />
          <DeleteSparePartModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={() => {
              // selectedPart'ni oldindan saqlash (null bo'lishidan oldin)
              const deletedPartId = selectedPart?._id;
              
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
              
              // Optimistic update - DARHOL o'chirilgan tovarni olib tashlash
              if (deletedPartId) {
                queryClient.setQueryData(['spare-parts', {}], (oldData: any) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    spareParts: oldData.spareParts.filter((part: any) => part._id !== deletedPartId),
                    pagination: {
                      ...oldData.pagination,
                      total: oldData.pagination.total - 1
                    }
                  };
                });
                
                // Background'da statistikani yangilash (sekin, lekin muhim emas)
                setTimeout(() => {
                  fetchSalesStats();
                }, 500);
              }
            }}
            sparePart={selectedPart}
          /> 
          <ViewSparePartModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedPart(null);
            }}
            sparePart={selectedPart}
          />
          <SellSparePartModal
            isOpen={isSellModalOpen}
            onClose={() => {
              setIsSellModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={handleSellSuccess}
            sparePart={selectedPart}
          />
        </>
      )}
    </div>
  );
});

export default MasterWarehouse;
 