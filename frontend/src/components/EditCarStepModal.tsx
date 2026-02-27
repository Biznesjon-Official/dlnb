import React, { useState, useEffect } from 'react';
import { X, Car, ArrowLeft, ArrowRight, Check, Plus, Trash2, Edit, Save, ClipboardList, Users, Calendar, AlertCircle, Search } from 'lucide-react';
import { Car as CarType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useCarTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useSpareParts } from '@/hooks/useSpareParts';
import { t } from '@/lib/transliteration';
import { format } from 'date-fns';
import { safeFormatDate } from '@/lib/utils';
import api from '@/lib/api';
import DeleteTaskModal from './DeleteTaskModal';
import { useTheme } from '@/contexts/ThemeContext';


interface Part {
  name: string;
  quantity: number;
  price: number;
}

interface ServiceItem {
  name: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

interface EditCarStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarType;
  updateCar: (id: string, data: any) => Promise<void>;
}

const EditCarStepModal: React.FC<EditCarStepModalProps> = ({ isOpen, onClose, car, updateCar }) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const { isOnline } = useBackendStatus();
  
  // Qidiruv uchun state'lar
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sparePartsData } = useSpareParts();
  const spareParts = sparePartsData?.spareParts || [];
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  const [formData, setFormData] = useState({
    make: '',
    carModel: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    ownerName: '',
    ownerPhone: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delivered'
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [newPart, setNewPart] = useState<Part>({
    name: '',
    quantity: 1,
    price: 0
  });
  
  // Autocomplete states - O'CHIRILDI
  // const [showSuggestions, setShowSuggestions] = useState(false);
  // const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  // const [selectedSparePartId, setSelectedSparePartId] = useState<string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    name: '',
    price: 0,
    quantity: 1,
    category: 'labor'
  });
  
  const [isUpdating, setIsUpdating] = useState(false);

  // const updateCarMutation = useUpdateCar(); // O'chirildi - prop sifatida keladi
  // const incrementUsageMutation = useIncrementSparePartUsage();
  // const { data: searchResults } = useSearchSpareParts(newPart.name, showSuggestions && newPart.name.length >= 2);
  // const suggestions = searchResults?.spareParts || [];
  
  useBodyScrollLock(isOpen);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    if (car && isOpen) {
      
      setFormData({
        make: car.make || '',
        carModel: car.carModel || '',
        year: car.year || new Date().getFullYear(),
        licensePlate: car.licensePlate || '',
        ownerName: car.ownerName || '',
        ownerPhone: car.ownerPhone || '',
        status: car.status || 'pending'
      });
      
      // Parts loading
      const carParts = car.parts || [];
      if (Array.isArray(carParts) && carParts.length > 0) {
        const validParts = carParts
          .filter(part => part && part.name && Number(part.quantity) > 0 && Number(part.price) >= 0)
          .map(part => ({
            name: String(part.name).trim(),
            quantity: Number(part.quantity),
            price: Number(part.price)
          }));
        setParts(validParts);
      } else {
        setParts([]);
      }
      
      // Service items loading
      const carServiceItems = (car as any).serviceItems || [];
      if (Array.isArray(carServiceItems) && carServiceItems.length > 0) {
        const validServiceItems = carServiceItems
          .filter((item: any) => item && item.name && Number(item.quantity) > 0 && Number(item.price) >= 0)
          .map((item: any) => ({
            name: String(item.name).trim(),
            price: Number(item.price),
            quantity: Number(item.quantity),
            category: item.category || 'labor'
          }));
        setServiceItems(validServiceItems);
      } else {
        setServiceItems([]);
      }
      
      setCurrentStep(1);
      setNewPart({ name: '', quantity: 1, price: 0 });
      setEditingPartIndex(null);
      setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
      setEditingServiceIndex(null);
    }
  }, [car, isOpen]);

  // Autocomplete functions - O'CHIRILDI, faqat oddiy input
  const handlePartNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPart(prev => ({ ...prev, name: value }));
  };
  
  // Qidiruv funksiyasi - Warehouse'dagi kabi
  const filteredSpareParts = React.useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const searchLower = searchQuery.toLowerCase();
    return spareParts.filter((part: any) => {
      const nameMatch = part.name.toLowerCase().includes(searchLower);
      const supplierMatch = part.supplier?.toLowerCase().includes(searchLower);
      const categoryMatch = part.category && (
        (part.category === 'balon' && ('balon'.includes(searchLower) || 'tire'.includes(searchLower))) ||
        (part.category === 'zapchast' && ('zapchast'.includes(searchLower) || 'spare'.includes(searchLower))) ||
        (part.category === 'boshqa' && ('boshqa'.includes(searchLower) || 'other'.includes(searchLower)))
      );
      return nameMatch || supplierMatch || categoryMatch;
    }).slice(0, 5); // Faqat 5 ta natija
  }, [spareParts, searchQuery]);
  
  // Qidiruv natijasidan tanlash
  const handleSelectSparePart = (part: any) => {
    setNewPart({
      name: part.name,
      quantity: 1,
      price: part.sellingPrice || part.price || 0
    });
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPart();
    }
  };

  const handleAddPart = () => {
    if (!newPart.name.trim()) {
      alert(t('Qism nomini kiriting', language));
      return;
    }
    if (newPart.quantity <= 0) {
      alert(t("Qism sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    // Narx 0 bo'lsa ham qabul qilamiz, faqat manfiy bo'lmasin
    if (newPart.price < 0) {
      alert(t("Qism narxi manfiy bo'lmasligi kerak", language));
      return;
    }
    
    const newPartData = {
      name: String(newPart.name).trim(),
      quantity: Math.max(1, Number(newPart.quantity)),
      price: Math.max(0, Number(newPart.price)) // 0 ham qabul qilamiz
    };
    
    // Faqat "Keltirish" rejimi - usedSpareParts ga qo'shmaslik
    
    setParts([...parts, newPartData]);
    setNewPart({ name: '', quantity: 1, price: 0 });
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleEditPart = (index: number) => {
    const part = parts[index];
    setNewPart(part);
    setEditingPartIndex(index);
  };

  const handleUpdatePart = () => {
    if (editingPartIndex === null) return;
    
    if (!newPart.name || newPart.quantity <= 0 || newPart.price < 0) {
      alert(t("Qism ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedParts = [...parts];
    updatedParts[editingPartIndex] = { 
      name: String(newPart.name).trim(),
      quantity: Number(newPart.quantity),
      price: Number(newPart.price)
    };
    
    setParts(updatedParts);
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleCancelEditPart = () => {
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleAddServiceItem = () => {
    if (!newServiceItem.name.trim()) {
      alert(t('Xizmat nomini kiriting', language));
      return;
    }
    
    // Qiymatlarni to'g'ri number'ga aylantirish
    const quantity = Number(newServiceItem.quantity) || 1;
    const price = Number(newServiceItem.price) || 0;
    
    if (quantity <= 0) {
      alert(t("Xizmat sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    if (price <= 0) {
      alert(t("Xizmat narxini to'g'ri kiriting (0 dan katta bo'lishi kerak)", language));
      return;
    }
    
    const newServiceData = {
      name: String(newServiceItem.name).trim(),
      price: price,
      quantity: quantity,
      category: newServiceItem.category || 'labor'
    };
    
    console.log('Adding service item:', newServiceData); // Debug log
    console.log('Total:', quantity * price); // Debug log
    
    setServiceItems([...serviceItems, newServiceData]);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
  };

  const handleRemoveServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const handleEditServiceItem = (index: number) => {
    const item = serviceItems[index];
    setNewServiceItem(item);
    setEditingServiceIndex(index);
  };

  const handleUpdateServiceItem = () => {
    if (editingServiceIndex === null) return;
    
    if (!newServiceItem.name || newServiceItem.quantity <= 0 || newServiceItem.price < 0) {
      alert(t("Xizmat ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedItems = [...serviceItems];
    updatedItems[editingServiceIndex] = {
      name: String(newServiceItem.name).trim(),
      price: Number(newServiceItem.price),
      quantity: Number(newServiceItem.quantity),
      category: newServiceItem.category
    };
    
    setServiceItems(updatedItems);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleCancelEditServiceItem = () => {
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const finalParts = parts.map(part => ({
        name: String(part.name).trim(),
        quantity: Number(part.quantity) || 1,
        price: Number(part.price) || 0,
        status: 'needed'
      })).filter(part => 
        part.name && 
        part.name.length > 0 && 
        part.quantity > 0 && 
        part.price >= 0
      );

      const finalServiceItems = serviceItems.map(item => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        category: item.category || 'labor'
      })).filter(item => 
        item.name && 
        item.name.length > 0 && 
        item.quantity > 0 && 
        item.price >= 0
      );

      const updateData = {
        make: formData.make.trim(),
        carModel: formData.carModel.trim(),
        year: Number(formData.year),
        licensePlate: formData.licensePlate.trim(),
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        status: formData.status,
        parts: finalParts,
        serviceItems: finalServiceItems
      };
      
      await updateCar(car._id, updateData);
      
      onClose();
    } catch (error: any) {
      console.error('❌ Error updating car:', error);
      alert(t(`Xatolik: ${error.response?.data?.message || "Noma'lum xatolik"}`, language));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? Number(value) : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  // Yuk mashinalari markalari (dunyodagi barcha mashhur markalar)
  const carMakes = [
    // Xitoy markalari
    'FAW', 'Foton', 'Howo', 'Shacman', 'Dongfeng', 'JAC', 'Beiben', 'Camc', 'Sinotruk',
    // Yevropa markalari
    'Mercedes-Benz', 'MAN', 'Scania', 'Volvo', 'DAF', 'Iveco', 'Renault',
    // Amerika markalari
    'Freightliner', 'Kenworth', 'Peterbilt', 'Mack', 'International', 'Western Star',
    // Yaponiya markalari
    'Hino', 'Mitsubishi Fuso', 'UD Trucks', 'Isuzu',
    // Rossiya va MDH markalari
    'Kamaz', 'MAZ', 'Ural', 'GAZ', 'ZIL', 'KrAZ',
    // Koreya markalari
    'Hyundai', 'Kia', 'Daewoo',
    // Boshqa
    'Tata', 'Ashok Leyland', 'Eicher', 'Boshqa'
  ].sort();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0 my-4 sm:my-0 ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`relative px-3 sm:px-6 py-3 sm:py-4 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white">{t('Mashina tahrirlash', language)}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 sm:p-1.5 transition-all"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className={`border-b px-3 sm:px-6 py-3 sm:py-4 ${
          isDarkMode
            ? 'bg-gray-800/50 border-red-900/30'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
            {[
              { step: 1, title: t('Mashina', language) },
              { step: 2, title: t('Qismlar', language) },
              { step: 3, title: t('Ish haqi', language) },
              { step: 4, title: t('Vazifalar', language) }
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                  step === currentStep 
                    ? isDarkMode
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : step < currentStep 
                      ? 'bg-green-600 text-white' 
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${
                  step === currentStep 
                    ? isDarkMode
                      ? 'text-red-400'
                      : 'text-blue-600'
                    : isDarkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                } hidden sm:inline`}>
                  {title}
                </span>
                {step < 4 && (
                  <ArrowRight className={`h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{t("Mashina ma'lumotlari", language)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{t('Marka', language)} *</label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{t('Model', language)} *</label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Lacetti"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{t('Yili', language)} *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{t('Davlat raqami', language)} *</label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="01 A 123 BC"
                  />
                </div>
              </div>
              <div className={`border-t pt-4 ${
                isDarkMode ? 'border-red-900/30' : 'border-gray-200'
              }`}>
                <h4 className={`text-sm sm:text-md font-medium mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{t('Egasi', language)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('Ism', language)} *</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('Telefon', language)} *</label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-900/40 border-blue-700'
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {t('Zapchast qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{t("Qism qo'shish (ixtiyoriy)", language)}</h3>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{parts.length} {t('ta', language)}</span>
              </div>
              
              {/* Qism qo'shish formi */}
              <div className={`rounded-xl p-3 sm:p-4 border ${
                isDarkMode
                  ? 'bg-green-900/40 border-green-700'
                  : 'bg-green-50 border-green-100'
              }`}>
                <div className="space-y-3">
                  {/* Qidiruv input - Ombordan qidirish */}
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-green-700 text-white placeholder:text-gray-500 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={t('Ombordan qidirish...', language)}
                    />
                    
                    {/* Qidiruv natijalari */}
                    {filteredSpareParts.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-900/30'
                          : 'bg-white border-gray-200'
                      }`}>
                        {filteredSpareParts.map((part: any) => (
                          <button
                            key={part._id}
                            type="button"
                            onClick={() => handleSelectSparePart(part)}
                            className={`w-full px-3 py-2 text-left transition-colors border-b last:border-b-0 ${
                              isDarkMode
                                ? 'hover:bg-gray-700 border-red-900/30'
                                : 'hover:bg-blue-50 border-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{part.name}</p>
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {part.quantity} {part.unit} • {(part.sellingPrice || part.price || 0).toLocaleString()} {t("so'm", language)}
                                </p>
                              </div>
                              <Plus className={`h-4 w-4 ${
                                isDarkMode ? 'text-green-400' : 'text-blue-600'
                              }`} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Qism nomi input - oddiy, autocomplete yo'q */}
                  <div>
                    <input
                      type="text"
                      value={newPart.name}
                      onChange={handlePartNameChange}
                      onKeyDown={handleKeyDown}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-green-700 text-white placeholder:text-gray-500 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder={t('Qism nomi (mijoz keltiradi)', language) + ' *'}
                    />
                  </div>
                  
                  {/* Boshqa maydonlar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={newPart.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Math.max(1, Number(value));
                        setNewPart({ ...newPart, quantity: numValue });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-green-700 text-white placeholder:text-gray-500 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder={t('Soni', language)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newPart.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Math.max(0, Number(value));
                        setNewPart({ ...newPart, price: numValue });
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-green-700 text-white placeholder:text-gray-500 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-2 py-1 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium text-gray-600 text-center">
                        = {((newPart.quantity || 1) * (newPart.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingPartIndex !== null ? handleUpdatePart : handleAddPart}
                      disabled={!newPart.name.trim() || newPart.quantity <= 0 || newPart.price < 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingPartIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingPartIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditPart}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 transition-all text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Qismlar ro'yxati */}
              <div className="space-y-2">
                <h4 className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{t("Qismlar ro'yxati", language)}</h4>
                {parts.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{t("Qismlar qo'shilmagan", language)}</p>
                ) : (
                  parts.map((part, index) => {
                    return (
                      <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg p-3 gap-3 sm:gap-0 border ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-900/30'
                          : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            isDarkMode
                              ? 'bg-red-900/40'
                              : 'bg-blue-100'
                          }`}>
                            <Edit className={`h-4 w-4 ${
                              isDarkMode ? 'text-red-400' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <h5 className={`text-sm font-medium truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>{part.name}</h5>
                            </div>
                            <div className={`flex flex-wrap items-center gap-1 sm:gap-2 text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <span>{part.quantity} {t('dona', language)}</span>
                              <span className="hidden sm:inline">×</span>
                              <span className={`font-medium ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}>{part.price.toLocaleString()} {t("so'm", language)}</span>
                              <span className="hidden sm:inline">=</span>
                              <span className="font-medium">{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 self-end sm:self-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditPart(index)}
                            className={`p-1.5 rounded-lg transition-all ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/40'
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(index)}
                            className={`p-1.5 rounded-lg transition-all ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/40'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Jami */}
              {parts.length > 0 && (
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  isDarkMode
                    ? 'bg-green-900/40 border-green-700'
                    : 'bg-green-50 border-green-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('Jami qismlar:', language)}</span>
                    <span className={`text-lg font-bold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-900/40 border-blue-700'
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {t('Ish haqi qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className={`text-base sm:text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{t('Ish haqi va xizmatlar (ixtiyoriy)', language)}</h3>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{serviceItems.length} {t('ta', language)}</span>
              </div>
              
              {/* Xizmat qo'shish formi */}
              <div className={`rounded-xl p-3 sm:p-4 border ${
                isDarkMode
                  ? 'bg-purple-900/40 border-purple-700'
                  : 'bg-purple-50 border-purple-100'
              }`}>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newServiceItem.name}
                      onChange={(e) => setNewServiceItem(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-purple-700 text-white placeholder:text-gray-500 focus:ring-purple-500 focus:border-purple-500'
                          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      }`}
                      placeholder={t('Xizmat nomi', language) + ' *'}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newServiceItem.price === 0 ? '' : newServiceItem.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Number(value);
                        setNewServiceItem(prev => ({ ...prev, price: numValue }));
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-purple-700 text-white placeholder:text-gray-500 focus:ring-purple-500 focus:border-purple-500'
                          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      }`}
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <input
                      type="number"
                      min="1"
                      value={newServiceItem.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Number(value);
                        setNewServiceItem(prev => ({ ...prev, quantity: numValue }));
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-purple-700 text-white placeholder:text-gray-500 focus:ring-purple-500 focus:border-purple-500'
                          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      }`}
                      placeholder={t('Soni', language) + ' *'}
                    />
                    <div className={`flex items-center justify-center rounded-lg px-2 py-1 col-span-2 sm:col-span-1 ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <span className={`text-xs font-medium text-center ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        = {((newServiceItem.quantity || 1) * (newServiceItem.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingServiceIndex !== null ? handleUpdateServiceItem : handleAddServiceItem}
                      disabled={!newServiceItem.name.trim() || newServiceItem.quantity <= 0}
                      className={`rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1 ${
                        isDarkMode
                          ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white'
                          : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingServiceIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingServiceIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditServiceItem}
                      className={`w-full rounded-lg py-2 transition-all text-sm ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Xizmatlar ro'yxati */}
              <div className="space-y-2">
                <h4 className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{t("Xizmatlar ro'yxati", language)}</h4>
                {serviceItems.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{t("Xizmatlar qo'shilmagan", language)}</p>
                ) : (
                  serviceItems.map((item, index) => (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg p-3 gap-3 sm:gap-0 border ${
                      isDarkMode
                        ? 'bg-gray-800 border-red-900/30'
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isDarkMode
                            ? 'bg-purple-900/40'
                            : 'bg-purple-100'
                        }`}>
                          <Edit className={`h-4 w-4 ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h5 className={`text-sm font-medium truncate ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{item.name}</h5>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium self-start sm:self-auto ${
                              isDarkMode
                                ? 'bg-purple-900/40 text-purple-300'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {t('Ish haqi', language)}
                            </span>
                          </div>
                          <div className={`flex flex-wrap items-center gap-1 sm:gap-2 text-xs mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span>{item.quantity} {t('dona', language)}</span>
                            <span className="hidden sm:inline">×</span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>{item.price.toLocaleString()} {t("so'm", language)}</span>
                            <span className="hidden sm:inline">=</span>
                            <span className="font-medium">{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditServiceItem(index)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDarkMode
                              ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-900/40'
                              : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceItem(index)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDarkMode
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/40'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Jami */}
              {serviceItems.length > 0 && (
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  isDarkMode
                    ? 'bg-purple-900/40 border-purple-700'
                    : 'bg-purple-50 border-purple-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('Jami ish haqi:', language)}</span>
                    <span className={`text-lg font-bold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-900/40 border-blue-700'
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {t('Vazifa qo\'shmasangiz ham o\'zgarishlarni saqlashingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <ClipboardList className={`h-5 w-5 mr-2 ${
                    isDarkMode ? 'text-red-400' : 'text-orange-600'
                  }`} />
                  {t('Vazifalar (ixtiyoriy)', language)}
                </h3>
              </div>

              {/* Mashina ma'lumotlari */}
              <div className={`rounded-lg p-3 border ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-700'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{t("Mashina ma'lumotlari", language)}</h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{formData.make} {formData.carModel} ({formData.year})</p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{formData.licensePlate}</p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{formData.ownerName} - {formData.ownerPhone}</p>
              </div>

              {/* Vazifalar ro'yxati - faqat online rejimda */}
              {isOnline ? (
                <TasksSection 
                  carId={car._id} 
                  language={language} 
                  isDarkMode={isDarkMode}
                  localServiceItems={serviceItems}
                />
              ) : (
                <div className={`border rounded-lg p-4 ${
                  isDarkMode
                    ? 'bg-yellow-900/40 border-yellow-700'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className={`h-5 w-5 mr-2 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                    }`}>
                      {t('Vazifalar bo\'limi offline rejimda mavjud emas', language)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Qismlar va xizmatlar xulasasi */}
              <div className="space-y-3">
                {parts.length > 0 && (
                  <div className={`rounded-lg p-3 border ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{t('Qismlar', language)} ({parts.length} {t('ta', language)})</h4>
                    {parts.slice(0, 3).map((part, index) => (
                      <div key={index} className={`flex justify-between text-xs mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <span className="truncate">{part.name} ({part.quantity})</span>
                        <span className="ml-2 flex-shrink-0">{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    ))}
                    {parts.length > 3 && (
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>+ {parts.length - 3} {t('ta yana', language)}</p>
                    )}
                    <div className={`border-t pt-2 mt-2 ${
                      isDarkMode ? 'border-red-900/30' : 'border-gray-300'
                    }`}>
                      <div className={`flex justify-between text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <span>{t('Jami:', language)}</span>
                        <span>{parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {serviceItems.length > 0 && (
                  <div className={`rounded-lg p-3 border ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{t('Xizmatlar', language)} ({serviceItems.length} {t('ta', language)})</h4>
                    {serviceItems.slice(0, 3).map((item, index) => (
                      <div key={index} className={`flex justify-between text-xs mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <span className="truncate">{item.name} ({item.quantity})</span>
                        <span className="ml-2 flex-shrink-0">{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    ))}
                    {serviceItems.length > 3 && (
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>+ {serviceItems.length - 3} {t('ta yana', language)}</p>
                    )}
                    <div className={`border-t pt-2 mt-2 ${
                      isDarkMode ? 'border-red-900/30' : 'border-gray-300'
                    }`}>
                      <div className={`flex justify-between text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <span>{t('Jami:', language)}</span>
                        <span>{serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Umumiy jami */}
                {(parts.length > 0 || serviceItems.length > 0) && (
                  <div className={`rounded-lg p-3 border ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-700'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <div className={`flex justify-between text-base font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-900'
                    }`}>
                      <span>{t('Umumiy jami:', language)}</span>
                      <span>
                        {(
                          parts.reduce((sum, part) => sum + (part.quantity * part.price), 0) +
                          serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                        ).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 ${
          isDarkMode
            ? 'border-red-900/30 bg-gray-800/50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1 ${
              isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('Orqaga', language)}
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                  isDarkMode
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {t('Keyingi', language)}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUpdating}
                className={`flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save className="h-4 w-4 mr-1" />
                {isUpdating ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// TasksSection component - vazifalarni ko'rsatish va tahrirlash
const TasksSection: React.FC<{ 
  carId: string; 
  language: 'latin' | 'cyrillic'; 
  isDarkMode: boolean;
  localServiceItems?: ServiceItem[]; // 3-stepdan kelgan yangi xizmatlar
}> = ({ carId, language, isDarkMode, localServiceItems = [] }) => {
  const { isOnline } = useBackendStatus();
  
  // Hook'larni doimo chaqirish, lekin offline bo'lsa yoki temp ID bo'lsa natijalarni ignore qilish
  const shouldFetchTasks = carId && !carId.startsWith('temp_');
  const { data: tasksData, isLoading } = useCarTasks(shouldFetchTasks ? carId : '');
  const { data: apprenticesData } = useUsers();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();
  
  const tasks = isOnline && shouldFetchTasks ? (tasksData?.tasks || []) : [];
  // Barcha shogirtlarni ko'rsatish (kunlik va foizlik)
  const apprentices = (apprenticesData?.users || []).filter((u: any) => u.role === 'apprentice');
  
  // Mashina xizmatlarini yuklash
  const [carServices, setCarServices] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (!isOnline || !carId) {
      setCarServices([]);
      return;
    }
    
    const loadServices = async () => {
      try {
        const response = await api.get(`/cars/${carId}/services`);
        const backendServices = response.data.services || [];
        
        console.log('🔵 Backend xizmatlar:', backendServices);
        console.log('🟢 Local xizmatlar (3-stepdan):', localServiceItems);
        
        // Backend xizmatlar va local xizmatlarni birlashtirish
        // Local xizmatlarni backend formatiga o'tkazish
        const localServicesFormatted = localServiceItems
          .filter(item => {
            // Faqat narxi 0 dan katta bo'lgan xizmatlarni olish
            const totalPrice = item.price * item.quantity;
            return totalPrice > 0;
          })
          .map((item, index) => ({
            _id: `local_${index}`, // Vaqtinchalik ID
            name: item.name,
            items: [{
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }],
            totalPrice: item.price * item.quantity,
            isLocal: true // Local ekanligini belgilash
          }));
        
        console.log('🟡 Formatlangan local xizmatlar:', localServicesFormatted);
        
        // Backend xizmatlarni ham filtrlash (0 so'mlik xizmatlarni olib tashlash)
        const filteredBackendServices = backendServices.filter((service: any) => {
          const totalPrice = service.totalPrice || 
            (service.items && service.items.length > 0
              ? service.items.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.price || 0)), 0)
              : 0);
          return totalPrice > 0;
        });
        
        // Backend va local xizmatlarni birlashtirish
        const allServices = [...filteredBackendServices, ...localServicesFormatted];
        console.log('🟣 Barcha xizmatlar (backend + local, 0 so\'mliksiz):', allServices);
        
        setCarServices(allServices);
      } catch (error) {
        console.error('Error loading services:', error);
        // Xatolik bo'lsa ham local xizmatlarni ko'rsatish
        const localServicesFormatted = localServiceItems
          .filter(item => {
            const totalPrice = item.price * item.quantity;
            return totalPrice > 0;
          })
          .map((item, index) => ({
            _id: `local_${index}`,
            name: item.name,
            items: [{
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }],
            totalPrice: item.price * item.quantity,
            isLocal: true
          }));
        console.log('⚠️ Xatolik, faqat local xizmatlar:', localServicesFormatted);
        setCarServices(localServicesFormatted);
      }
    };
    
    loadServices();
  }, [carId, isOnline, localServiceItems]);
  
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    estimatedHours: 1,
    payment: 0,
    service: '', // Xizmat ID
    assignments: [] as any[]
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return t('Berilgan', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Tugallangan', language);
      case 'approved': return t('Tasdiqlangan', language);
      case 'rejected': return t('Rad etilgan', language);
      default: return status;
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task._id);
    setEditingTask({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate && !isNaN(new Date(task.dueDate).getTime()) ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || 1,
      payment: task.payment || 0,
      service: task.service?._id || task.service || '', // Xizmat ID
      assignments: task.assignments || []
    });
  };

  // Tahrirlashda xizmat tanlanganda avtomatik to'ldirish
  const handleEditServiceSelect = (serviceId: string) => {
    const selectedService = carServices.find(s => s._id === serviceId);
    if (selectedService) {
      // Xizmatning jami narxini olish (totalPrice yoki items'dan hisoblash)
      let totalPayment = selectedService.totalPrice || 0;
      
      // Agar totalPrice bo'lmasa, items'dan hisoblash
      if (!totalPayment && selectedService.items && selectedService.items.length > 0) {
        totalPayment = selectedService.items.reduce((sum: number, item: any) => {
          return sum + ((item.quantity || 1) * (item.price || 0));
        }, 0);
      }
      
      // Xizmat nomini olish (birinchi item'dan yoki xizmat nomidan)
      const serviceName = selectedService.items && selectedService.items.length > 0
        ? selectedService.items[0].name
        : selectedService.name || '';
      
      setEditingTask({
        ...editingTask,
        service: serviceId,
        title: serviceName,
        description: selectedService.description || '',
        payment: totalPayment
      });
    }
  };

  const handleSaveTask = async () => {
    if (!editingTaskId || !editingTask) return;

    try {
      // Assignments ni to'g'ri formatga o'tkazish
      const formattedAssignments = editingTask.assignments
        .filter((a: any) => a.apprenticeId || a.apprentice?._id)
        .map((assignment: any) => ({
          apprenticeId: assignment.apprenticeId || assignment.apprentice?._id || assignment.apprentice,
          dailyAmount: assignment.dailyAmount || 0
        }));

      if (formattedAssignments.length === 0) {
        alert(t('Kamida bitta shogird tanlang', language));
        return;
      }

      // Task data tayyorlash - description'ni olib tashlash
      const taskData: any = {
        title: editingTask.title,
        dueDate: editingTask.dueDate,
        priority: editingTask.priority,
        estimatedHours: editingTask.estimatedHours,
        payment: editingTask.payment,
        assignments: formattedAssignments
      };

      // Service faqat mavjud va local emas bo'lsa qo'shish
      if (editingTask.service && !editingTask.service.startsWith('local_')) {
        taskData.service = editingTask.service;
      }

      await updateTaskMutation.mutateAsync({
        id: editingTaskId,
        data: taskData
      });
      setEditingTaskId(null);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskToDelete(taskId);
  };

  // These functions are used by DeleteTaskModal internally
  // const confirmDeleteTask = async () => {
  //   if (!taskToDelete) return;
  //   
  //   try {
  //     await deleteTaskMutation.mutateAsync(taskToDelete);
  //     setTaskToDelete(null);
  //   } catch (error) {
  //     console.error('Error deleting task:', error);
  //   }
  // };

  const handleAddNewTask = async () => {
    if (!newTask.title.trim()) {
      alert(t('Vazifa nomini kiriting', language));
      return;
    }
    
    try {
      // Assignments ni to'g'ri formatga o'tkazish
      const formattedAssignments = newTask.assignments
        .filter((a: any) => a.apprenticeId)
        .map((assignment: any) => ({
          apprenticeId: assignment.apprenticeId,
          dailyAmount: assignment.dailyAmount || 0
        }));

      if (formattedAssignments.length === 0) {
        alert(t('Kamida bitta shogird tanlang', language));
        return;
      }

      // Task data tayyorlash - description'ni olib tashlash
      const taskData: any = {
        title: newTask.title,
        car: carId,
        priority: newTask.priority,
        estimatedHours: newTask.estimatedHours,
        payment: newTask.payment,
        assignments: formattedAssignments
      };

      // DueDate faqat mavjud va to'g'ri formatda bo'lsa qo'shish
      if (newTask.dueDate && newTask.dueDate.trim()) {
        taskData.dueDate = newTask.dueDate;
      } else {
        // Agar dueDate bo'lmasa, bugundan 7 kun keyingi sanani qo'yish
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        taskData.dueDate = defaultDate.toISOString().split('T')[0];
      }

      // Service faqat mavjud va local emas bo'lsa qo'shish
      if (newTask.service && !newTask.service.startsWith('local_')) {
        taskData.service = newTask.service;
      }

      console.log('📤 Vazifa yaratish uchun yuborilayotgan ma\'lumot:', taskData);

      await createTaskMutation.mutateAsync(taskData);
      setIsAddingNew(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        estimatedHours: 1,
        payment: 0,
        service: '',
        assignments: []
      });
    } catch (error) {
      console.error('Error creating task:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
    }
  };

  // Xizmat tanlanganda avtomatik to'ldirish
  const handleServiceSelect = (serviceId: string) => {
    const selectedService = carServices.find(s => s._id === serviceId);
    if (selectedService) {
      // Xizmatning jami narxini olish (totalPrice yoki items'dan hisoblash)
      let totalPayment = selectedService.totalPrice || 0;
      
      // Agar totalPrice bo'lmasa, items'dan hisoblash
      if (!totalPayment && selectedService.items && selectedService.items.length > 0) {
        totalPayment = selectedService.items.reduce((sum: number, item: any) => {
          return sum + ((item.quantity || 1) * (item.price || 0));
        }, 0);
      }
      
      // Xizmat nomini olish (birinchi item'dan yoki xizmat nomidan)
      const serviceName = selectedService.items && selectedService.items.length > 0
        ? selectedService.items[0].name
        : selectedService.name || '';
      
      setNewTask({
        ...newTask,
        service: serviceId,
        title: serviceName,
        description: selectedService.description || '',
        payment: totalPayment
      });
    }
  };

  const handleAddApprentice = (taskData: any, setTaskData: (data: any) => void) => {
    setTaskData({
      ...taskData,
      assignments: [
        ...taskData.assignments,
        {
          apprenticeId: '',
          percentage: 50
        }
      ]
    });
  };

  const handleRemoveApprentice = (taskData: any, setTaskData: (data: any) => void, index: number) => {
    setTaskData({
      ...taskData,
      assignments: taskData.assignments.filter((_: any, i: number) => i !== index)
    });
  };

  const handleUpdateApprentice = (taskData: any, setTaskData: (data: any) => void, index: number, field: string, value: any) => {
    const updatedAssignments = [...taskData.assignments];
    
    // Agar shogird tanlanayotgan bo'lsa, uning foizini avtomatik olish
    if (field === 'apprenticeId' && value) {
      const selectedApprentice = apprentices.find((app: any) => app._id === value);
      
      // Kunlik ishchi uchun foiz 0, foizlik uchun o'z foizi
      const apprenticePercentage = selectedApprentice?.paymentType === 'daily' 
        ? 0 
        : (selectedApprentice?.percentage || 50);
      
      updatedAssignments[index] = {
        ...updatedAssignments[index],
        apprenticeId: value,
        percentage: apprenticePercentage,
        dailyAmount: selectedApprentice?.paymentType === 'daily' ? 0 : undefined // Kunlik ishchi uchun dailyAmount field qo'shish
      };
    } else if (field === 'dailyAmount') {
      // Kunlik ishchi uchun kiritilgan pulni saqlash
      updatedAssignments[index] = {
        ...updatedAssignments[index],
        dailyAmount: Number(value) || 0
      };
    } else {
      updatedAssignments[index] = {
        ...updatedAssignments[index],
        [field]: value
      };
    }
    
    setTaskData({
      ...taskData,
      assignments: updatedAssignments
    });
  };

  if (isLoading) {
    return (
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 text-center">
        <p className="text-sm text-gray-600">{t('Vazifalar yuklanmoqda...', language)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Yangi vazifa qo'shish tugmasi */}
      {!isAddingNew && (
        <button
          onClick={() => setIsAddingNew(true)}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all border ${
            isDarkMode
              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50'
              : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{t('Yangi vazifa qo\'shish', language)}</span>
        </button>
      )}

      {/* Yangi vazifa qo'shish formasi */}
      {isAddingNew && (
        <div className={`rounded-lg p-3 border ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-red-900/50'
            : 'bg-gradient-to-r from-red-50 to-gray-50 border-red-200'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 ${
            isDarkMode ? 'text-red-400' : 'text-gray-900'
          }`}>{t('Yangi vazifa', language)}</h4>
          <div className="space-y-2">
            {/* Xizmat tanlash */}
            {carServices.length > 0 && (() => {
              // Allaqachon berilgan xizmatlar ID larini olish
              const assignedServiceIds = tasks
                .filter((task: any) => task.service)
                .map((task: any) => {
                  // service obyekt yoki string bo'lishi mumkin
                  if (typeof task.service === 'string') {
                    return task.service;
                  }
                  return task.service._id || task.service;
                })
                .filter(Boolean); // null/undefined larni olib tashlash
              
              console.log('🔍 Berilgan xizmatlar ID lari:', assignedServiceIds);
              console.log('📋 Barcha xizmatlar:', carServices.map((s: any) => ({ id: s._id, name: s.name, isLocal: s.isLocal })));
              console.log('📝 Barcha vazifalar:', tasks.map((t: any) => ({ id: t._id, title: t.title, service: t.service })));
              
              // Berilmagan xizmatlarni filtrlash
              const availableServices = carServices.filter(
                (service: any) => !assignedServiceIds.includes(service._id)
              );
              
              console.log('✅ Mavjud xizmatlar (berilmagan):', availableServices.map((s: any) => ({ id: s._id, name: s.name })));
              
              if (availableServices.length === 0) {
                return (
                  <div className={`rounded-lg p-2 text-xs border ${
                    isDarkMode
                      ? 'bg-yellow-900/40 border-yellow-700 text-yellow-300'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }`}>
                    {t('Barcha xizmatlar allaqachon berilgan', language)}
                  </div>
                );
              }
              
              return (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('Xizmat tanlash (ixtiyoriy)', language)}
                  </label>
                  <select
                    value={newTask.service}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 ${
                      isDarkMode
                        ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                        : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                    }`}
                  >
                    <option value="">{t('Xizmat tanlang yoki qo\'lda kiriting', language)}</option>
                    {availableServices.map((service: any) => {
                      // Xizmatning jami narxini hisoblash
                      const totalPrice = service.totalPrice || 
                        (service.items && service.items.length > 0
                          ? service.items.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.price || 0)), 0)
                          : 0);
                      
                      // Xizmat nomini olish
                      const serviceName = service.items && service.items.length > 0
                        ? service.items[0].name
                        : service.name || '';
                      
                      return (
                        <option key={service._id} value={service._id}>
                          {serviceName} - {totalPrice.toLocaleString()} {t("so'm", language)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })()}
            
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder={t('Vazifa nomi', language)}
              className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 ${
                isDarkMode
                  ? 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-red-500'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-red-500'
              }`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                    : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                }`}
              />
              <div className={`w-full px-3 py-2 text-sm rounded-lg font-medium ${
                isDarkMode
                  ? 'bg-gray-900 border border-gray-700 text-gray-300'
                  : 'bg-gray-50 border border-gray-200 text-gray-700'
              }`}>
                {newTask.payment ? newTask.payment.toLocaleString() : 0} {t("so'm", language)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('Soat (taxminiy)', language)}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 1 })}
                  className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                      : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('Muhimlik', language)}
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                      : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                  }`}
                >
                  <option value="low">{t('Past', language)}</option>
                  <option value="medium">{t('O\'rta', language)}</option>
                  <option value="high">{t('Yuqori', language)}</option>
                </select>
              </div>
            </div>
            
            {/* Shogirdlar */}
            <div className={`space-y-2 rounded-lg p-3 border ${
              isDarkMode
                ? 'bg-gray-800/50 border-red-900/50'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{t('Shogirdlar', language)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddApprentice(newTask, setNewTask)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Plus className="h-3 w-3" />
                  <span>{t('Qo\'shish', language)}</span>
                </button>
              </div>
              
              {newTask.assignments.length === 0 ? (
                <div className={`text-center py-3 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {t('Shogird qo\'shing', language)}
                </div>
              ) : (
                newTask.assignments.map((assignment: any, index: number) => {
                  // Shogirdni topish
                  const selectedApprentice = apprentices.find((app: any) => app._id === assignment.apprenticeId);
                  const isDaily = selectedApprentice?.paymentType === 'daily';
                  
                  return (
                    <div key={index} className={`space-y-2 rounded-lg p-2 border ${
                      isDarkMode
                        ? 'bg-gray-900 border-red-900/50'
                        : 'bg-white border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <select
                            value={assignment.apprenticeId}
                            onChange={(e) => handleUpdateApprentice(newTask, setNewTask, index, 'apprenticeId', e.target.value)}
                            className={`w-full px-2 py-1.5 text-sm rounded focus:ring-2 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                            }`}
                          >
                            <option value="">{t('Shogird tanlang', language)}</option>
                            {apprentices.map((app: any) => (
                              <option key={app._id} value={app._id}>
                                {app.name} {app.paymentType === 'daily' ? '(Kunlik)' : `(${app.percentage || 50}%)`}
                              </option>
                            ))}
                          </select>
                        </div>
                        {!isDaily && (
                          <div className={`w-16 px-2 py-1.5 text-xs rounded text-center font-medium ${
                            isDarkMode
                              ? 'bg-gray-900 border border-gray-700 text-gray-300'
                              : 'bg-gray-50 border border-gray-200 text-gray-700'
                          }`}>
                            {assignment.percentage || 0}%
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveApprentice(newTask, setNewTask, index)}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Kunlik ishchi uchun pul kiritish */}
                      {isDaily && assignment.apprenticeId && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('Pul:', language)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={assignment.dailyAmount || ''}
                            onChange={(e) => handleUpdateApprentice(newTask, setNewTask, index, 'dailyAmount', e.target.value)}
                            placeholder={t("Pul kiriting", language)}
                            className={`flex-1 px-2 py-1.5 text-sm rounded focus:ring-2 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-red-500'
                            }`}
                          />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t("so'm", language)}
                          </span>
                        </div>
                      )}

                      {/* Earnings calculation */}
                      {newTask.payment > 0 && assignment.apprenticeId && (
                        <div className={`p-2 rounded text-xs space-y-1 ${
                          isDarkMode ? 'bg-gray-900/50' : 'bg-purple-50'
                        }`}>
                          {(() => {
                            const percentageApprentices = newTask.assignments.filter((a: any) => {
                              if (!a.apprenticeId) return false;
                              const app = apprentices.find((ap: any) => ap._id === a.apprenticeId);
                              return app && app.paymentType !== 'daily';
                            });
                            const dailyWorkers = newTask.assignments.filter((a: any) => {
                              if (!a.apprenticeId) return false;
                              const app = apprentices.find((ap: any) => ap._id === a.apprenticeId);
                              return app && app.paymentType === 'daily';
                            });

                            if (percentageApprentices.length > 0 && dailyWorkers.length > 0) {
                              if (isDaily) {
                                const dailyAmount = assignment.dailyAmount || 0;
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>👤 {t('Kunlik ishchi:', language)}</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>{dailyAmount.toLocaleString()} {t("so'm", language)}</span>
                                    </div>
                                    <div className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {t('(Foizlik shogird pulidan olinadi)', language)}
                                    </div>
                                  </>
                                );
                              } else {
                                const apprenticeShare = (newTask.payment * assignment.percentage) / 100;
                                const totalDailyAmount = dailyWorkers.reduce((sum: number, dw: any) => sum + (dw.dailyAmount || 0), 0);
                                const dailyAmountPerPercentage = totalDailyAmount / percentageApprentices.length;
                                const apprenticeFinal = apprenticeShare - dailyAmountPerPercentage;
                                const masterPercentage = 100 - assignment.percentage;
                                const masterShare = (newTask.payment * masterPercentage) / 100;
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>💰 {t('Foiz ulushi:', language)} ({assignment.percentage}%)</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{apprenticeShare.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>🚚 {t('Kunlik ishchi:', language)}</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>-{dailyAmountPerPercentage.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1 mt-1">
                                      <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>✅ {t('Shogird oladi:', language)}</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{apprenticeFinal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)} ({masterPercentage}%)</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{masterShare.toLocaleString()}</span>
                                    </div>
                                  </>
                                );
                              }
                            }

                            const allocatedAmount = newTask.payment / newTask.assignments.filter((a: any) => a.apprenticeId).length;
                            const earning = isDaily ? 0 : (allocatedAmount * assignment.percentage) / 100;
                            const masterShare = allocatedAmount - earning;
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>💰 {t('Ajratilgan:', language)}</span>
                                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{allocatedAmount.toLocaleString()}</span>
                                </div>
                                {isDaily ? (
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)}</span>
                                    <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{allocatedAmount.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>👤 {t('Shogird', language)} ({assignment.percentage}%):</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{earning.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)}</span>
                                      <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{masterShare.toLocaleString()}</span>
                                    </div>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={handleAddNewTask}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {t('Saqlash', language)}
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTask({
                    title: '',
                    description: '',
                    dueDate: '',
                    priority: 'medium',
                    estimatedHours: 1,
                    payment: 0,
                    service: '',
                    assignments: []
                  });
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('Bekor qilish', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vazifalar ro'yxati */}
      {tasks.length === 0 ? (
        <div className={`rounded-lg p-4 border text-center ${
          isDarkMode
            ? 'bg-gray-800/50 border-red-900/50'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{t('Vazifalar yo\'q', language)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: any) => (
            <div key={task._id} className={`rounded-lg p-3 border ${
              isDarkMode
                ? 'bg-gray-800 border-red-900/50'
                : 'bg-white border-gray-200'
            }`}>
              {editingTaskId === task._id ? (
                // Tahrirlash rejimi
                <div className="space-y-2">
                  {/* Xizmat tanlash - faqat berilmagan xizmatlar */}
                  {carServices.length > 0 && (() => {
                    // Allaqachon berilgan xizmatlar (hozirgi vazifadan tashqari)
                    const assignedServiceIds = tasks
                      .filter((t: any) => t._id !== task._id && t.service)
                      .map((t: any) => {
                        // service obyekt yoki string bo'lishi mumkin
                        if (typeof t.service === 'string') {
                          return t.service;
                        }
                        return t.service._id || t.service;
                      })
                      .filter(Boolean); // null/undefined larni olib tashlash
                    
                    console.log('🔍 Tahrirlash - Berilgan xizmatlar ID lari:', assignedServiceIds);
                    console.log('📋 Tahrirlash - Barcha xizmatlar:', carServices.map((s: any) => ({ id: s._id, name: s.name })));
                    
                    // Berilmagan xizmatlar
                    const availableServices = carServices.filter(
                      (service: any) => !assignedServiceIds.includes(service._id)
                    );
                    
                    console.log('✅ Tahrirlash - Mavjud xizmatlar:', availableServices.map((s: any) => ({ id: s._id, name: s.name })));
                    
                    if (availableServices.length === 0 && !editingTask.service) {
                      return (
                        <div className={`rounded-lg p-2 text-xs border ${
                          isDarkMode
                            ? 'bg-yellow-900/40 border-yellow-700 text-yellow-300'
                            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                          {t('Barcha xizmatlar allaqachon berilgan', language)}
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                          {t('Xizmat (ixtiyoriy)', language)}
                        </label>
                        <select
                          value={editingTask.service || ''}
                          onChange={(e) => handleEditServiceSelect(e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 ${
                            isDarkMode
                              ? 'bg-gray-800 border border-gray-700 text-white'
                              : 'bg-white border border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">{t('Xizmat tanlang yoki qo\'lda kiriting', language)}</option>
                          {availableServices.map((service: any) => {
                            // Xizmatning jami narxini hisoblash
                            const totalPrice = service.totalPrice || 
                              (service.items && service.items.length > 0
                                ? service.items.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.price || 0)), 0)
                                : 0);
                            
                            // Xizmat nomini olish
                            const serviceName = service.items && service.items.length > 0
                              ? service.items[0].name
                              : service.name || '';
                            
                            return (
                              <option key={service._id} value={service._id}>
                                {serviceName} - {totalPrice.toLocaleString()} {t("so'm", language)}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })()}
                  
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    placeholder={t('Vazifa nomi', language)}
                    className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 ${
                        isDarkMode
                          ? 'bg-gray-800 border border-gray-700 text-white'
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className={`w-full px-3 py-2 text-sm rounded-lg font-medium ${
                      isDarkMode
                        ? 'bg-gray-900 border border-gray-700 text-gray-300'
                        : 'bg-gray-50 border border-gray-200 text-gray-700'
                    }`}>
                      {editingTask.payment ? editingTask.payment.toLocaleString() : 0} {t("so'm", language)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('Soat (taxminiy)', language)}
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={editingTask.estimatedHours}
                        onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: parseFloat(e.target.value) || 1 })}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 ${
                          isDarkMode
                            ? 'bg-gray-800 border border-gray-700 text-white'
                            : 'bg-white border border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('Muhimlik', language)}
                      </label>
                      <select
                        value={editingTask.priority}
                        onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                        className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 ${
                          isDarkMode
                            ? 'bg-gray-800 border border-gray-700 text-white'
                            : 'bg-white border border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="low">{t('Past', language)}</option>
                        <option value="medium">{t('O\'rta', language)}</option>
                        <option value="high">{t('Yuqori', language)}</option>
                      </select>
                    </div>
                  </div>

                  {/* Shogirdlar tahrirlash */}
                  <div className={`space-y-2 rounded-lg p-3 border ${
                    isDarkMode ? 'bg-gray-800/50 border-red-900/50' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{t('Shogirdlar', language)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddApprentice(editingTask, setEditingTask)}
                        className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{t('Qo\'shish', language)}</span>
                      </button>
                    </div>
                    {editingTask.assignments.length === 0 ? (
                      <div className={`text-center py-3 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('Shogird qo\'shing', language)}
                      </div>
                    ) : (
                      editingTask.assignments.map((assignment: any, index: number) => {
                        const selectedApprentice = apprentices.find((app: any) =>
                          app._id === (assignment.apprenticeId || assignment.apprentice?._id)
                        );
                        const isDaily = selectedApprentice?.paymentType === 'daily';

                        return (
                          <div key={index} className={`space-y-2 rounded-lg p-2 border ${
                            isDarkMode ? 'bg-gray-900 border-red-900/50' : 'bg-white border-red-200'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1">
                                <select
                                  value={assignment.apprenticeId || assignment.apprentice?._id || ''}
                                  onChange={(e) => handleUpdateApprentice(editingTask, setEditingTask, index, 'apprenticeId', e.target.value)}
                                  className={`w-full px-2 py-1.5 text-sm rounded focus:ring-2 ${
                                    isDarkMode
                                      ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                      : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                                  }`}
                                >
                                  <option value="">{t('Tanlang', language)}</option>
                                  {apprentices.map((app: any) => (
                                    <option key={app._id} value={app._id}>
                                      {app.name} {app.paymentType === 'daily' ? '(Kunlik)' : `(${app.percentage || 50}%)`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {!isDaily && (
                                <div className={`w-16 px-2 py-1.5 text-xs rounded text-center font-medium ${
                                  isDarkMode
                                    ? 'bg-gray-900 border border-gray-700 text-gray-300'
                                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                                }`}>
                                  {assignment.percentage || 0}%
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveApprentice(editingTask, setEditingTask, index)}
                                className={`p-1.5 rounded transition-colors ${
                                  isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Kunlik ishchi uchun pul kiritish */}
                            {isDaily && (assignment.apprenticeId || assignment.apprentice?._id) && (
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Pul:', language)}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={assignment.dailyAmount || ''}
                                  onChange={(e) => handleUpdateApprentice(editingTask, setEditingTask, index, 'dailyAmount', e.target.value)}
                                  placeholder={t("Pul kiriting", language)}
                                  className={`flex-1 px-2 py-1.5 text-sm rounded focus:ring-2 ${
                                    isDarkMode
                                      ? 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-red-500'
                                      : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-red-500'
                                  }`}
                                />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t("so'm", language)}</span>
                              </div>
                            )}

                            {/* Earnings calculation */}
                            {editingTask.payment > 0 && (assignment.apprenticeId || assignment.apprentice?._id) && (
                              <div className={`p-2 rounded text-xs space-y-1 ${
                                isDarkMode ? 'bg-gray-900/50' : 'bg-purple-50'
                              }`}>
                                {(() => {
                                  const percentageApprentices = editingTask.assignments.filter((a: any) => {
                                    const id = a.apprenticeId || a.apprentice?._id;
                                    if (!id) return false;
                                    const app = apprentices.find((ap: any) => ap._id === id);
                                    return app && app.paymentType !== 'daily';
                                  });
                                  const dailyWorkers = editingTask.assignments.filter((a: any) => {
                                    const id = a.apprenticeId || a.apprentice?._id;
                                    if (!id) return false;
                                    const app = apprentices.find((ap: any) => ap._id === id);
                                    return app && app.paymentType === 'daily';
                                  });

                                  if (percentageApprentices.length > 0 && dailyWorkers.length > 0) {
                                    if (isDaily) {
                                      const dailyAmount = assignment.dailyAmount || 0;
                                      return (
                                        <>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>👤 {t('Kunlik ishchi:', language)}</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>{dailyAmount.toLocaleString()} {t("so'm", language)}</span>
                                          </div>
                                          <div className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {t('(Foizlik shogird pulidan olinadi)', language)}
                                          </div>
                                        </>
                                      );
                                    } else {
                                      const apprenticeShare = (editingTask.payment * assignment.percentage) / 100;
                                      const totalDailyAmount = dailyWorkers.reduce((sum: number, dw: any) => sum + (dw.dailyAmount || 0), 0);
                                      const dailyAmountPerPercentage = totalDailyAmount / percentageApprentices.length;
                                      const apprenticeFinal = apprenticeShare - dailyAmountPerPercentage;
                                      const masterPercentage = 100 - assignment.percentage;
                                      const masterShare = (editingTask.payment * masterPercentage) / 100;
                                      return (
                                        <>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>💰 {t('Foiz ulushi:', language)} ({assignment.percentage}%)</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{apprenticeShare.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>🚚 {t('Kunlik ishchi:', language)}</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>-{dailyAmountPerPercentage.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between border-t pt-1 mt-1">
                                            <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>✅ {t('Shogird oladi:', language)}</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{apprenticeFinal.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)} ({masterPercentage}%)</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{masterShare.toLocaleString()}</span>
                                          </div>
                                        </>
                                      );
                                    }
                                  }

                                  const validAssignments = editingTask.assignments.filter((a: any) => a.apprenticeId || a.apprentice?._id);
                                  const allocatedAmount = validAssignments.length > 0 ? editingTask.payment / validAssignments.length : 0;
                                  const earning = isDaily ? 0 : (allocatedAmount * assignment.percentage) / 100;
                                  const masterShare = allocatedAmount - earning;
                                  return (
                                    <>
                                      <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>💰 {t('Ajratilgan:', language)}</span>
                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{allocatedAmount.toLocaleString()}</span>
                                      </div>
                                      {isDaily ? (
                                        <div className="flex justify-between">
                                          <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)}</span>
                                          <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{allocatedAmount.toLocaleString()}</span>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>👤 {t('Shogird', language)} ({assignment.percentage}%):</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{earning.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>👨‍🏫 {t('Ustoz:', language)}</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{masterShare.toLocaleString()}</span>
                                          </div>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={handleSaveTask}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {t('Saqlash', language)}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTaskId(null);
                        setEditingTask(null);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  </div>
                </div>
              ) : (
                // Ko'rish rejimi
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h5>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ml-2 flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                      {getTaskStatusText(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{safeFormatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.payment > 0 && (
                      <span className="font-semibold text-green-600">
                        {task.payment.toLocaleString()} {t("so'm", language)}
                      </span>
                    )}
                  </div>

                  {task.assignments && task.assignments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.assignments.map((assignment: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {assignment.apprentice?.name || t('Noma\'lum', language)}
                          {assignment.percentage && (
                            <span className="ml-1 text-blue-500">({assignment.percentage}%)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium"
                    >
                      <Edit className="h-3 w-3" />
                      <span>{t('Tahrirlash', language)}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Task Modal */}
      <DeleteTaskModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
      />
    </div>
  );
};

export default EditCarStepModal;