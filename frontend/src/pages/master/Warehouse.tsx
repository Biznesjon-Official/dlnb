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
import { useSparePartsNew } from '@/hooks/useSparePartsNew';
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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 50);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeStatsTab, setActiveStatsTab] = useState<'warehouse' | 'sales'>('warehouse');

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // YANGI HOOK - Cars kabi
  const { 
    spareParts, 
    loading: isLoading,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    sellSparePart,
    refetch: refetchSpareParts
  } = useSparePartsNew();

  // Umumiy loading holati - barcha statistikalar bir vaqtda
  const isAllStatsLoading = isLoading || isLoadingStats;

  const filteredParts = useMemo(() => {
    if (!spareParts.length) return [];
    if (!debouncedSearch) return spareParts.filter((part: any) => part && part._id);
    
    const searchLower = debouncedSearch.toLowerCase();
    return spareParts.filter((part: any) => {
      // Null/undefined check
      if (!part || !part._id) return false;
      
      // Nom bo'yicha qidirish
      const nameMatch = part.name && part.name.toLowerCase().includes(searchLower);
      
      // Supplier bo'yicha qidirish
      const supplierMatch = part.supplier && part.supplier.toLowerCase().includes(searchLower);
      
      // Kategoriya bo'yicha qidirish - YAXSHILANGAN
      const categoryMatch = part.category && (
        (part.category === 'balon' && (
          'balon'.includes(searchLower) || 
          'tire'.includes(searchLower) ||
          'шина'.includes(searchLower) || // Kirill
          'балон'.includes(searchLower)    // Kirill
        )) ||
        (part.category === 'zapchast' && (
          'zapchast'.includes(searchLower) || 
          'spare'.includes(searchLower) ||
          'запчаст'.includes(searchLower)  // Kirill
        )) ||
        (part.category === 'boshqa' && (
          'boshqa'.includes(searchLower) || 
          'other'.includes(searchLower) ||
          'бошқа'.includes(searchLower)    // Kirill
        ))
      );
      
      // Balon ma'lumotlari bo'yicha qidirish
      const tireMatch = part.category === 'balon' && (
        (part.tireSize && part.tireSize.toLowerCase().includes(searchLower)) ||
        (part.tireFullSize && part.tireFullSize.toLowerCase().includes(searchLower)) ||
        (part.tireBrand && part.tireBrand.toLowerCase().includes(searchLower)) ||
        (part.tireType && part.tireType.toLowerCase().includes(searchLower)) ||
        (part.tireCategory && part.tireCategory.toLowerCase().includes(searchLower))
      );
      
      return nameMatch || supplierMatch || categoryMatch || tireMatch;
    });
  }, [spareParts, debouncedSearch]);

  const lowStockParts = useMemo(() => {
    return spareParts.filter((part: any) => part && typeof part.quantity === 'number' && part.quantity <= 3);
  }, [spareParts]);

  const statistics = useMemo(() => {
    if (!spareParts.length) return {
      totalValue: 0,
      totalProfit: 0,
      totalItems: 0,
      totalQuantity: 0
    };

    // Faqat valid part'larni hisoblash
    const validParts = spareParts.filter((part: any) => part && part._id && typeof part.quantity === 'number');

    return {
      totalValue: validParts.reduce((sum: number, part: any) => 
        sum + ((part.sellingPrice || 0) * (part.quantity || 0)), 0),
      totalProfit: validParts.reduce((sum: number, part: any) => 
        sum + (((part.sellingPrice || 0) - (part.costPrice || 0)) * (part.quantity || 0)), 0),
      totalItems: validParts.length,
      totalQuantity: validParts.reduce((sum: number, part: any) => 
        sum + (part.quantity || 0), 0)
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
    // 3 tagacha - QIZIL
    if (quantity <= 3) {
      return {
        card: 'border-red-500 bg-gradient-to-br from-red-100 to-pink-100 hover:border-red-600',
        badge: 'bg-gradient-to-br from-red-500 to-pink-600',
        buttons: {
          sell: 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-700',
          view: 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-700',
          edit: 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700',
          delete: 'bg-white border-2 border-gray-700 text-gray-700 hover:bg-gray-50 hover:border-gray-800'
        }
      };
    } 
    // 10 tagacha - SARIQ
    else if (quantity <= 10) {
      return {
        card: 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 hover:border-yellow-600',
        badge: 'bg-gradient-to-br from-yellow-500 to-amber-600',
        buttons: {
          sell: 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700',
          view: 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700',
          edit: 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700',
          delete: 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700'
        }
      };
    } 
    // 10 dan ko'p - YASHIL
    else {
      return {
        card: 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 hover:border-green-600',
        badge: 'bg-gradient-to-br from-green-500 to-emerald-600',
        buttons: {
          sell: 'bg-white border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-800',
          view: 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700',
          edit: 'bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50 hover:border-orange-700',
          delete: 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700'
        }
      };
    }
  }, []);

  const fetchSalesStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Cache'ni bypass qilish uchun timestamp qo'shamiz
      const timestamp = Date.now();
      const response = await api.get(`/spare-parts/sales/statistics?_t=${timestamp}`);
      setSalesStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleSellSuccess = useCallback(async (_soldQuantity: number) => {
    // Modal'ni yopish
    setIsSellModalOpen(false);
    setSelectedPart(null);
    
    // Loading state'ni yoqish
    setIsLoadingStats(true);
    
    // DARHOL statistikani yangilash (cache'siz)
    await fetchSalesStats();
  }, [fetchSalesStats]);

  useEffect(() => {
    fetchSalesStats();
  }, [fetchSalesStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-7 lg:space-y-8 p-3 sm:p-5 lg:p-7 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/app/master/cashier')}
          className="group flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t('Kassaga qaytish', language)}</span>
        </button>

        {/* Main Container - Bitta katta container */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10 p-5 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform">
                    <Package className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                    {t("Ombor", language)}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">{t("Tovarlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="h-5 w-5 relative z-10" />
                <span className="relative z-10">{t('Tovar qo\'shish', language)}</span>
              </button>
            </div>

            {/* Stats Tabs - 50% width on desktop, 100% on mobile */}
            <div className="w-full lg:w-1/2 flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActiveStatsTab('warehouse')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  activeStatsTab === 'warehouse'
                    ? 'bg-white text-purple-600 shadow-md scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{t('Ombor', language)}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveStatsTab('sales')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  activeStatsTab === 'sales'
                    ? 'bg-white text-green-600 shadow-md scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t('Sotuvlar', language)}</span>
                </div>
              </button>
            </div>

            {/* Stats Cards - Warehouse Tab */}
            {activeStatsTab === 'warehouse' && (
              <div className="flex flex-wrap gap-4 lg:flex-nowrap">
                {isAllStatsLoading ? (
                  // Loading state
                  <>
                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                          {t('Jami', language)}
                        </span>
                      </div>
                      <div className="h-8 w-16 bg-purple-200 animate-pulse rounded"></div>
                      <p className="text-sm text-purple-600 mt-2">{t('Tovar turlari', language)}</p>
                    </div>

                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          {t('Qiymat', language)}
                        </span>
                      </div>
                      <div className="h-8 w-20 bg-blue-200 animate-pulse rounded"></div>
                      <p className="text-sm text-blue-600 mt-2">{t('Umumiy qiymat', language)}</p>
                    </div>

                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                          {t('Ogohlantirish', language)}
                        </span>
                      </div>
                      <div className="h-8 w-12 bg-red-200 animate-pulse rounded"></div>
                      <p className="text-sm text-red-600 mt-2">{t('Kam qolgan', language)}</p>
                    </div>
                  </>
                ) : (
                  // Data loaded
                  <>
                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg shadow-md">
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                          {t('Jami', language)}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-purple-900 mb-1">
                        {spareParts?.length || 0}
                      </div>
                      <p className="text-sm text-purple-600 font-medium">{t('Tovar turlari', language)}</p>
                    </div>

                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          {t('Qiymat', language)}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-blue-900 mb-1">
                        {formatCurrency(statistics.totalValue)}
                      </div>
                      <p className="text-sm text-blue-600 font-medium">{t('Umumiy qiymat', language)}</p>
                    </div>

                    <div className="flex-1 min-w-[200px] relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-red-500 rounded-lg shadow-md">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                          {t('Ogohlantirish', language)}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-red-900 mb-1">
                        {lowStockParts.length}
                      </div>
                      <p className="text-sm text-red-600 font-medium">{t('Kam qolgan', language)}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Stats Cards - Sales Tab */}
            {activeStatsTab === 'sales' && (
              <div className="flex flex-wrap gap-4 lg:flex-nowrap">
                {isAllStatsLoading ? (
                  // Loading state
                  <>
                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-500 rounded-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-700">{t('Sotuvlar', language)}</span>
                      </div>
                      <div className="h-8 w-12 bg-green-200 animate-pulse rounded"></div>
                    </div>

                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500 rounded-lg">
                          <Box className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700">{t('Miqdor', language)}</span>
                      </div>
                      <div className="h-8 w-12 bg-blue-200 animate-pulse rounded"></div>
                    </div>

                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-500 rounded-lg">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700">{t('Tushum', language)}</span>
                      </div>
                      <div className="h-7 w-20 bg-purple-200 animate-pulse rounded"></div>
                    </div>
                    
                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-yellow-500 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-yellow-700">{t('Foyda', language)}</span>
                      </div>
                      <div className="h-7 w-20 bg-yellow-200 animate-pulse rounded"></div>
                    </div>
                  </>
                ) : (
                  // Data loaded
                  <>
                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-500 rounded-lg shadow-md">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-700">{t('Sotuvlar', language)}</span>
                      </div>
                      <div className="text-2xl font-black text-green-900">
                        {salesStats?.totalSales || 0}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500 rounded-lg shadow-md">
                          <Box className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700">{t('Miqdor', language)}</span>
                      </div>
                      <div className="text-2xl font-black text-blue-900">
                        {salesStats?.totalQuantitySold || 0}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-500 rounded-lg shadow-md">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-700">{t('Tushum', language)}</span>
                      </div>
                      <div className="text-xl font-black text-purple-900">
                        {formatCurrency(salesStats?.totalRevenue || 0)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-yellow-500 rounded-lg shadow-md">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-yellow-700">{t('Foyda', language)}</span>
                      </div>
                      <div className="text-xl font-black text-yellow-900">
                        {formatCurrency(salesStats?.totalProfit || 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Search Bar */}
            <div className="mb-6 mt-6 pt-6 border-t border-gray-200 flex justify-end">
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('Tovar qidirish...', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Parts List */}
            <div className="mt-6">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                {t("Tovarlar ro'yxati", language)}
              </h3>

              <div className="pr-2">
              {/* Loading overlay - faqat birinchi yuklanishda */}
              {isLoading && !spareParts.length ? (
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
                        className={`group relative overflow-hidden rounded-lg p-3 border-2 hover:shadow-lg transition-all duration-300 ${stockColor.card}`}
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

                      {/* Action Buttons - CARD RANGIGA MOS */}
                      <div className="mt-2 bg-white rounded-lg p-1.5 border-2 border-gray-300 shadow-md">
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => handleSell(part)}
                            className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Sotish', language)}
                          > 
                            <DollarSign className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleView(part)}
                            className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Ko\'rish', language)}
                          >
                            <Eye className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleEdit(part)}
                            className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Tahrirlash', language)}
                          >
                            <Edit className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(part)}
                            className="p-2 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('O\'chirish', language)}
                          >
                            <Trash2 className="h-4 w-4 font-bold" />
                          </button>
                        </div>
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
      </div>

      {/* Modals */}
      <CreateSparePartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          // Modal'ni yopish
          setIsCreateModalOpen(false);
          
          // Loading state'ni yoqish
          setIsLoadingStats(true);
          
          // Ma'lumotlarni yangilash
          await Promise.all([
            refetchSpareParts(),
            fetchSalesStats()
          ]);
        }}
        createSparePart={createSparePart}
      />
      {selectedPart && (
        <>
          <EditSparePartModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={async () => {
              // Modal'ni yopish
              setIsEditModalOpen(false);
              setSelectedPart(null);
              
              // Ma'lumotlarni yangilash
              await refetchSpareParts();
            }}
            sparePart={selectedPart}
            updateSparePart={updateSparePart}
          />
          <DeleteSparePartModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={async () => {
              // Modal'ni yopish
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
              
              // Loading state'ni yoqish
              setIsLoadingStats(true);
              
              // Ma'lumotlarni yangilash
              await Promise.all([
                refetchSpareParts(),
                fetchSalesStats()
              ]);
            }}
            sparePart={selectedPart}
            deleteSparePart={deleteSparePart}
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
            sellSparePart={sellSparePart}
          />
        </>
      )}
    </div>
  );
});

export default MasterWarehouse;
 