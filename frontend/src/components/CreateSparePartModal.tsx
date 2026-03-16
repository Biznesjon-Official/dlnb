import React, { useState, useMemo } from 'react';
import { X, Plus, AlertCircle, Package, Upload, Image as ImageIcon } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useSpareParts } from '@/hooks/useSpareParts';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPart?: any) => void;
  createSparePart: (data: any) => Promise<any>; // YANGI: Function prop
}

const CreateSparePartModal: React.FC<CreateSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  createSparePart // YANGI: Function prop
}) => {
  const { isDarkMode } = useTheme();
  
  // Mavjud zapchastlar nomlarini olish
  const { data: sparePartsData } = useSpareParts();
  const spareParts = useMemo(() => sparePartsData?.spareParts || [], [sparePartsData]);
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS'); // Valyuta tanlash
  const [exchangeRate] = useState(12800); // 1 USD = 12,800 UZS (o'zgarmas)
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '', // O'zini narxi
    costPriceDisplay: '', // Formatli ko'rsatish
    sellingPrice: '', // Sotish narxi
    sellingPriceDisplay: '', // Formatli ko'rsatish
    price: '', // Deprecated - backward compatibility
    priceDisplay: '',
    currency: 'UZS', // Valyuta turi
    quantity: '',
    imageUrl: '', // YANGI: Rasm URL
    // Balon uchun qo'shimcha maydonlar
    category: 'zapchast' as 'balon' | 'zapchast' | 'boshqa',
    tireType: 'universal' as 'yozgi' | 'qishki' | 'universal',
    tireBrand: '',
    tireCategory: '', // Balon kategoriyasi (R60, R22.5 va h.k.)
    tireSize: '' // Aniq o'lcham
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Mavjud balon nomlarini olish (unique)
  const existingTireNames = useMemo(() => {
    if (!spareParts.length) return [];
    
    return spareParts
      .filter((part: any) => part.category === 'balon' && part.name)
      .map((part: any) => part.name)
      .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index) // Unique
      .sort(); // Alifbo tartibida
  }, [spareParts]);

  // Balon uchun avtomatik nom yaratish
  const generateTireName = () => {
    if (formData.category !== 'balon') return '';
    
    const parts = [];
    
    // 1. O'lcham (majburiy)
    if (formData.tireSize) parts.push(formData.tireSize);
    
    // 2. Balon turi
    const typeMap = {
      'yozgi': t('Yozgi', language),
      'qishki': t('Qishki', language),
      'universal': t('Universal', language)
    };
    parts.push(typeMap[formData.tireType]);
    
    // 3. Brend (oxirida, ixtiyoriy)
    if (formData.tireBrand) parts.push(`(${formData.tireBrand})`);
    
    return parts.join(' ');
  };

  // Balon ma'lumotlari o'zgarganda nomni avtomatik yangilash
  React.useEffect(() => {
    if (formData.category === 'balon' && formData.tireSize) {
      const autoName = generateTireName();
      if (autoName) {
        setFormData(prev => ({ ...prev, name: autoName }));
      }
    }
  }, [formData.category, formData.tireSize, formData.tireBrand, formData.tireType]);

  // Kategoriya o'zgarganda nomni tozalash
  React.useEffect(() => {
    if (formData.category !== 'balon') {
      setFormData(prev => ({ ...prev, name: '' }));
    }
  }, [formData.category]);

  // Balon kategoriyalari va ularga tegishli o'lchamlar - TO'LIQ RO'YXAT
  const tireSizeOptions: Record<string, string[]> = {
    // R22.5 - Eng keng tarqalgan fura o'lchami (Standart fura)
    'R22.5': [
      '11R22.5',
      '12R22.5',
      '13R22.5',
      '215/75R22.5',
      '225/70R22.5',
      '235/75R22.5',
      '245/70R22.5',
      '255/70R22.5',
      '265/70R22.5',
      '275/70R22.5',
      '275/80R22.5',
      '285/70R22.5',
      '285/75R22.5',
      '295/60R22.5',
      '295/75R22.5',
      '295/80R22.5',
      '305/70R22.5',
      '315/60R22.5',
      '315/70R22.5',
      '315/80R22.5',
      '325/95R22.5',
      '355/50R22.5',
      '385/55R22.5',
      '385/65R22.5',
      '425/65R22.5',
      '445/65R22.5',
      '455/45R22.5',
      '495/45R22.5'
    ],
    
    // R24.5 - Katta fura va avtobus
    'R24.5': [
      '11R24.5',
      '12R24.5',
      '255/70R24.5',
      '275/70R24.5',
      '285/75R24.5',
      '295/75R24.5',
      '305/75R24.5'
    ],
    
    // R19.5 - O'rta fura va yengil yuk
    'R19.5': [
      '8R19.5',
      '225/70R19.5',
      '245/70R19.5',
      '265/70R19.5',
      '285/70R19.5'
    ],
    
    // R17.5 - Kichik fura va yengil yuk mashinalari
    'R17.5': [
      '215/75R17.5',
      '225/75R17.5',
      '235/75R17.5',
      '245/70R17.5',
      '265/70R17.5'
    ],
    
    // R20 - Yuk mashinalari (eski standart)
    'R20': [
      '7.50R20',
      '8.25R20',
      '9.00R20',
      '10.00R20',
      '11.00R20',
      '12.00R20',
      '13.00R20',
      '260/508R20',
      '275/80R20',
      '295/80R20',
      '315/80R20'
    ],
    
    // R16 - Yengil yuk va kichik fura
    'R16': [
      '6.50R16',
      '7.00R16',
      '7.50R16',
      '8.25R16',
      '9.00R16',
      '185/75R16',
      '195/75R16',
      '205/75R16',
      '215/75R16',
      '225/75R16',
      '235/85R16',
      '245/75R16'
    ],
    
    // R15 - Yengil yuk
    'R15': [
      '6.00R15',
      '6.50R15',
      '7.00R15',
      '185/80R15',
      '195/80R15',
      '205/80R15',
      '215/80R15'
    ],
    
    // R14 - Kichik yuk mashinalari
    'R14': [
      '185/80R14',
      '195/80R14',
      '205/80R14'
    ]
  };

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  // Rasm tanlash
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fayl hajmini tekshirish (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Rasm hajmi 5MB dan kichik bo\'lishi kerak', language));
      return;
    }

    // Fayl turini tekshirish
    if (!file.type.startsWith('image/')) {
      toast.error(t('Faqat rasm fayllari qabul qilinadi', language));
      return;
    }

    setImageFile(file);
    
    // Preview yaratish
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Rasm yuklash
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      console.log('⚠️ imageFile yo\'q, rasm yuklanmaydi');
      return null;
    }

    console.log('📤 Rasm yuklanmoqda...', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('📡 Backend\'ga so\'rov yuborilmoqda...');
      const response = await api.post('/spare-parts/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Backend javob berdi:', response.data);
      console.log('📸 Qaytgan imageUrl:', response.data.imageUrl);

      return response.data.imageUrl;
    } catch (error: any) {
      console.error('❌ Rasm yuklashda xatolik:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(t('Rasm yuklanmadi', language));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Rasmni o'chirish
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = t("Nom kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    // Kamida bitta narx kiritilishi kerak
    if ((!formData.costPrice || Number(formData.costPrice) <= 0) && 
        (!formData.sellingPrice || Number(formData.sellingPrice) <= 0)) {
      newErrors.costPrice = t("Kamida bitta narx kiritilishi kerak", language);
      newErrors.sellingPrice = t("Kamida bitta narx kiritilishi kerak", language);
    }

    // Agar ikkala narx ham kiritilgan bo'lsa, sotish narxi o'zini narxidan kichik bo'lmasligi kerak
    if (formData.costPrice && formData.sellingPrice && 
        Number(formData.costPrice) > 0 && Number(formData.sellingPrice) > 0 &&
        Number(formData.sellingPrice) < Number(formData.costPrice)) {
      newErrors.sellingPrice = t("Sotish narxi o'zini narxidan kichik bo'lmasligi kerak", language);
    }

    if (!formData.quantity || Number(formData.quantity) < 0) {
      newErrors.quantity = t("Miqdor majburiy va 0 dan kichik bo'lmasligi kerak", language);
    }

    // Balon uchun validatsiya
    if (formData.category === 'balon') {
      if (!formData.tireCategory) {
        newErrors.tireCategory = t("Balon turini tanlang", language);
      }
      if (!formData.tireSize || formData.tireSize.length < 2) {
        newErrors.tireSize = t("Balon o'lchamini tanlang", language);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('📝 Form submit boshlandi');
    console.log('🖼️ imageFile:', imageFile ? 'Mavjud' : 'Yo\'q');
    console.log('🔗 formData.imageUrl:', formData.imageUrl);

    // Agar rasm tanlangan bo'lsa, avval uni yuklash
    let uploadedImageUrl = formData.imageUrl;
    if (imageFile) {
      console.log('📤 Rasm yuklanmoqda...');
      const url = await uploadImage();
      console.log('📥 Yuklangan rasm URL:', url);
      if (url) {
        uploadedImageUrl = url;
      }
    }

    console.log('✅ Final imageUrl:', uploadedImageUrl);

    // Agar faqat bitta narx kiritilgan bo'lsa, ikkinchisini avtomatik to'ldirish
    const costPrice = Number(formData.costPrice) || Number(formData.sellingPrice);
    const sellingPrice = Number(formData.sellingPrice) || Number(formData.costPrice);

    // Kategoriya nomini qo'shish (faqat zapchast va boshqa uchun)
    let finalName = formData.name;
    if (formData.category === 'zapchast') {
      finalName = `${t('Zapchast', language)} ${formData.name}`;
    } else if (formData.category === 'boshqa') {
      finalName = `${t('Boshqa', language)} ${formData.name}`;
    }
    // Balon uchun prefix qo'shilmaydi - to'g'ridan-to'g'ri nom

    // Form ni tozalash
    setFormData({
      name: '',
      costPrice: '',
      costPriceDisplay: '',
      sellingPrice: '',
      sellingPriceDisplay: '',
      price: '',
      priceDisplay: '',
      currency: 'UZS',
      quantity: '',
      imageUrl: '',
      category: 'zapchast',
      tireType: 'universal',
      tireBrand: '',
      tireCategory: '',
      tireSize: ''
    });
    setImageFile(null);
    setImagePreview('');
    setCurrency('UZS');
    setErrors({});

    // To'g'ridan-to'g'ri funksiyani chaqirish - hook ichida optimistic update
    createSparePart({
      name: finalName,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      price: sellingPrice,
      currency: currency,
      quantity: Number(formData.quantity),
      imageUrl: uploadedImageUrl || undefined,
      category: formData.category,
      ...(formData.category === 'balon' && {
        tireSize: formData.tireSize,
        tireBrand: formData.tireBrand || undefined,
        tireType: formData.tireType
      })
    });

    // Modal'ni yopish va callback - DARHOL
    onClose();
    onSuccess();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Base64 URL'larni bloklash
    if (name === 'imageUrl' && value.startsWith('data:image/')) {
      toast.error(t('Base64 rasm URL qabul qilinmaydi. Iltimos, rasm faylini yuklang yoki tashqi URL kiriting.', language));
      return;
    }
    
    if (name === 'costPrice') {
      // O'zini narxi formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        costPrice: numericValue.toString(),
        costPriceDisplay: formatted
      }));
    } else if (name === 'sellingPrice') {
      // Sotish narxi formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        sellingPrice: numericValue.toString(),
        sellingPriceDisplay: formatted
      }));
    } else if (name === 'price') {
      // Pul formatini boshqarish (deprecated)
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        price: numericValue.toString(),
        priceDisplay: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Xatolikni tozalash
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* IXCHAM MODAL - Scroll kerak emas */}
      <div className={`relative rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden mx-2 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-red-900/30' 
          : 'bg-white border-orange-200'
      }`}>
        {/* Header - IXCHAM */}
        <div className={isDarkMode ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 px-3 py-2.5' : 'bg-gradient-to-r from-orange-500 to-amber-600 px-3 py-2.5'}>
          <button onClick={onClose} className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t('Yangi zapchast', language)}</h2>
              <p className={`text-[10px] ${isDarkMode ? 'text-red-100' : 'text-orange-100'}`}>{t("Ma'lumotlarni kiriting", language)}</p>
            </div>
          </div>
        </div>

        {/* Form - IXCHAM - Barcha maydonlar kichik */}
        <form onSubmit={handleSubmit} className="p-2.5 space-y-2 max-h-[calc(92vh-70px)] overflow-y-auto [&_label]:text-[11px] [&_label]:mb-0.5 [&_input]:px-2 [&_input]:py-1.5 [&_input]:text-xs [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-xs [&_.text-xs]:text-[10px] [&_.text-sm]:text-xs [&_.gap-2]:gap-1 [&_.space-y-4]:space-y-2 [&_.p-4]:p-2 [&_.p-3]:p-2 [&_.rounded-xl]:rounded-lg [&_.mb-2]:mb-0.5 [&_.mt-2]:mt-1">
          {/* Kategoriya tanlash */}
          <div>
            <label className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('Kategoriya', language)} *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full border-2 rounded-md focus:outline-none transition-all ${
                isDarkMode 
                  ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500' 
                  : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
              }`}
            >
              <option value="zapchast">{t('Zapchast', language)}</option>
              <option value="balon">{t('Balon', language)}</option>
              <option value="boshqa">{t('Boshqa', language)}</option>
            </select>
          </div>

          {/* Balon uchun qo'shimcha maydonlar - STEP BY STEP */}
          {formData.category === 'balon' && (
            <div className={`space-y-2.5 rounded-lg p-2.5 border-2 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <h3 className={`text-xs font-bold flex items-center gap-1.5 ${
                isDarkMode ? 'text-red-400' : 'text-orange-600'
              }`}>
                <Package className="h-3.5 w-3.5" />
                {t('Balon ma\'lumotlari', language)}
              </h3>
              
              {/* 1-QADAM: Balon kategoriyasi */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {t('1-qadam: Balon turi', language)} *
                </label>
                
                {/* Select + Input Combo */}
                <div className="space-y-2">
                  {/* Select - Asosiy tanlash */}
                  <select
                    name="tireCategory"
                    value={formData.tireCategory}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        tireCategory: e.target.value,
                        tireSize: '' // Kategoriya o'zgarganda o'lchamni tozalash
                      }));
                      if (errors.tireCategory) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.tireCategory;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                      errors.tireCategory 
                        ? 'border-red-500 focus:border-red-400' 
                        : isDarkMode
                          ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                          : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                    }`}
                  >
                    <option value="">{t('Balon turini tanlang', language)}</option>
                    <option value="R22.5">R22.5 - Standart fura</option>
                    <option value="R24.5">R24.5 - Katta fura</option>
                    <option value="R19.5">R19.5 - O'rta fura</option>
                    <option value="R17.5">R17.5 - Kichik fura</option>
                    <option value="R20">R20 - Eski standart</option>
                    <option value="R16">R16 - Yengil yuk</option>
                    <option value="R15">R15 - Yengil yuk</option>
                    <option value="R14">R14 - Kichik yuk</option>
                  </select>
                  
                  {/* Input - O'zi yozish */}
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.tireCategory}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          tireCategory: e.target.value,
                          tireSize: ''
                        }));
                        if (errors.tireCategory) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.tireCategory;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder={t('Yoki o\'zi yozing (masalan: R25)', language)}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                        isDarkMode
                          ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500 placeholder-gray-500'
                          : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      ✏️
                    </span>
                  </div>
                  
                  {/* Tez tanlash tugmalari */}
                  <div className="flex flex-wrap gap-1.5">
                    {['R22.5', 'R24.5', 'R19.5', 'R17.5', 'R20', 'R16'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tireCategory: cat,
                            tireSize: ''
                          }));
                          if (errors.tireCategory) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.tireCategory;
                              return newErrors;
                            });
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors font-medium ${
                          formData.tireCategory === cat
                            ? isDarkMode
                              ? 'bg-red-900/50 border-red-500 text-red-300'
                              : 'bg-orange-100 border-orange-500 text-orange-700'
                            : isDarkMode
                              ? 'bg-gray-800 border-red-900/30 hover:bg-gray-700 hover:border-red-500 text-gray-400'
                              : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-400 text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  {/* Yangi kategoriya haqida ma'lumot */}
                  {formData.tireCategory && !['R22.5', 'R24.5', 'R19.5', 'R17.5', 'R20', 'R16', 'R15', 'R14'].includes(formData.tireCategory) && (
                    <div className={`p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-blue-900/20 border-blue-700/50'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className={`text-xs font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        ℹ️ {t('Yangi kategoriya', language)}: <span className="font-bold">{formData.tireCategory}</span>
                      </p>
                    </div>
                  )}
                </div>
                
                {errors.tireCategory && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tireCategory}
                  </p>
                )}
              </div>

              {/* 2-QADAM: Aniq o'lcham (faqat kategoriya tanlanganda) */}
              {formData.tireCategory && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {t('2-qadam: Aniq o\'lcham', language)} *
                  </label>
                  
                  {/* Agar standart kategoriya bo'lsa - select, aks holda - input */}
                  {tireSizeOptions[formData.tireCategory] ? (
                    <>
                      {/* Select + Input Combo */}
                      <div className="space-y-2">
                        {/* Select - Asosiy tanlash */}
                        <select
                          name="tireSize"
                          value={formData.tireSize}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                            errors.tireSize 
                              ? 'border-red-500 focus:border-red-400' 
                              : isDarkMode
                                ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                                : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                          }`}
                        >
                          <option value="">{t('O\'lchamni tanlang', language)}</option>
                          {tireSizeOptions[formData.tireCategory]?.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        
                        {/* Input - O'zi yozish */}
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.tireSize}
                            onChange={(e) => setFormData(prev => ({ ...prev, tireSize: e.target.value }))}
                            placeholder={t('Yoki o\'zi yozing', language)}
                            className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                              isDarkMode
                                ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500 placeholder-gray-500'
                                : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500 placeholder-gray-400'
                            }`}
                          />
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            ✏️
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Yangi kategoriya uchun - faqat input */}
                      <input
                        type="text"
                        name="tireSize"
                        value={formData.tireSize}
                        onChange={handleChange}
                        placeholder={t('O\'lchamni kiriting (masalan: 295/80R22.5)', language)}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                          errors.tireSize 
                            ? 'border-red-500 focus:border-red-400' 
                            : isDarkMode
                              ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500 placeholder-gray-500'
                              : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500 placeholder-gray-400'
                        }`}
                      />
                      <p className={`mt-1 text-xs ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        💡 {t('Yangi kategoriya uchun o\'lchamni o\'zingiz kiriting', language)}
                      </p>
                    </>
                  )}
                  
                  {errors.tireSize && (
                    <p className="mt-2 text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tireSize}
                    </p>
                  )}
                </div>
              )}

              {/* 3-QADAM: Balon mavsumi (faqat o'lcham tanlanganda) */}
              {formData.tireSize && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {t('3-qadam: Balon mavsumi', language)} *
                  </label>
                  <select
                    name="tireType"
                    value={formData.tireType}
                    onChange={handleChange}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                      isDarkMode
                        ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                        : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                    }`}
                  >
                    <option value="universal">{t('Universal', language)}</option>
                    <option value="yozgi">{t('Yozgi', language)}</option>
                    <option value="qishki">{t('Qishki', language)}</option>
                  </select>
                </div>
              )}

              {/* 4-QADAM: Balon brendi (faqat mavsumi tanlanganda) */}
              {formData.tireSize && formData.tireType && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {t('4-qadam: Balon brendi', language)} ({t('ixtiyoriy', language)})
                  </label>
                  
                  {/* Mavjud balon nomlari ko'rsatish */}
                  {existingTireNames.length > 0 && (
                    <div className={`mb-2 p-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                        : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1.5 ${
                        isDarkMode ? 'text-red-400' : 'text-orange-600'
                      }`}>
                        💡 {t('Mavjud balonlar', language)} ({existingTireNames.length} ta):
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {existingTireNames.slice(0, 10).map((name: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              // Nomni input'ga qo'yish
                              setFormData(prev => ({ ...prev, name: name }));
                            }}
                            className={`px-2 py-1 text-xs rounded-md border transition-colors font-medium ${
                              isDarkMode
                                ? 'bg-gray-800 border-red-900/30 hover:bg-gray-700 hover:border-red-500 text-red-400'
                                : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-400 text-orange-600'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                        {existingTireNames.length > 10 && (
                          <span className={`px-2 py-1 text-xs font-medium ${
                            isDarkMode ? 'text-red-400' : 'text-orange-600'
                          }`}>
                            +{existingTireNames.length - 10} ta
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Combobox: Input + Datalist (o'zi yozish yoki tanlash) */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="tireBrand"
                      value={formData.tireBrand}
                      onChange={handleChange}
                      list="tire-brands-list"
                      placeholder={t('Brend nomini yozing yoki tanlang', language)}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                        isDarkMode
                          ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500 placeholder-gray-500'
                          : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                    <datalist id="tire-brands-list">
                      <option value="Michelin">Michelin (Fransiya)</option>
                      <option value="Bridgestone">Bridgestone (Yaponiya)</option>
                      <option value="Continental">Continental (Germaniya)</option>
                      <option value="Goodyear">Goodyear (AQSh)</option>
                      <option value="Pirelli">Pirelli (Italiya)</option>
                      <option value="Hankook">Hankook (Janubiy Koreya)</option>
                      <option value="Yokohama">Yokohama (Yaponiya)</option>
                      <option value="Kumho">Kumho (Janubiy Koreya)</option>
                      <option value="Dunlop">Dunlop (Buyuk Britaniya)</option>
                      <option value="Firestone">Firestone (AQSh)</option>
                      <option value="BFGoodrich">BFGoodrich (AQSh)</option>
                      <option value="Toyo">Toyo (Yaponiya)</option>
                      <option value="Nokian">Nokian (Finlandiya)</option>
                      <option value="Kama">Kama (Rossiya)</option>
                      <option value="Belshina">Belshina (Belarus)</option>
                      <option value="Matador">Matador (Slovakiya)</option>
                    </datalist>
                    
                    {/* Tez tanlash tugmalari */}
                    <div className="flex flex-wrap gap-1.5">
                      {['Michelin', 'Bridgestone', 'Continental', 'Goodyear', 'Pirelli', 'Hankook'].map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tireBrand: brand }))}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors font-medium ${
                            formData.tireBrand === brand
                              ? isDarkMode
                                ? 'bg-red-900/50 border-red-500 text-red-300'
                                : 'bg-orange-100 border-orange-500 text-orange-700'
                              : isDarkMode
                                ? 'bg-gray-800 border-red-900/30 hover:bg-gray-700 hover:border-red-500 text-gray-400'
                                : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-400 text-gray-700'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Avtomatik yaratilgan nom ko'rsatish - faqat brend tanlangandan keyin */}
              {formData.tireSize && formData.tireType && (
                <div className={`rounded-lg p-3 border ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border-green-700/50'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    isDarkMode ? 'text-green-400' : 'text-green-700'
                  }`}>
                    {t('Avtomatik yaratilgan nom:', language)}
                  </p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    {generateTireName() || t('Ma\'lumotlar to\'liq emas', language)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Zapchast nomi - IXCHAM */}
          {formData.category !== 'balon' && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {formData.category === 'zapchast' ? t('Zapchast nomi', language) : t('Tovar nomi', language)} *
              </label>
              <div className="flex gap-2">
                <div className={`flex-shrink-0 px-3 py-2 text-sm rounded-lg font-medium border ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 text-red-400'
                    : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-orange-600'
                }`}>
                  {formData.category === 'zapchast' ? t('Zapchast', language) : t('Boshqa', language)}
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-400' 
                      : isDarkMode
                        ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                        : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                  }`}
                  placeholder={formData.category === 'zapchast' ? t('Masalan: Tormoz kolodkasi', language) : t('Masalan: Yog\'', language)}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.name}
                </p>
              )}
              {/* Avtomatik yaratilgan nom ko'rsatish */}
              {formData.name && (
                <div className={`mt-2 rounded-lg p-2 border ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border-green-700/50'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    isDarkMode ? 'text-green-400' : 'text-green-700'
                  }`}>
                    {t('Saqlanadigan nom:', language)}
                  </p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    {formData.category === 'zapchast' ? t('Zapchast', language) : t('Boshqa', language)} {formData.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5-QADAM: Narxlar - IXCHAM (faqat balon turi tanlangandan keyin) */}
          {((formData.category === 'balon' && formData.tireSize && formData.tireType) || (formData.category !== 'balon' && formData.name.length >= 2)) && (
            <div className="transition-all duration-300 ease-in-out">
              {/* Valyuta */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('Valyuta', language)}:</span>
                <div className={`flex rounded p-0.5 border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-red-900/30' 
                    : 'bg-gray-100 border-orange-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setCurrency('UZS')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      currency === 'UZS'
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {t("So'm", language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      currency === 'USD'
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* O'zini narxi */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {t("O'zini narxi", language)}
                  </label>
                  <input
                    type="text"
                    name="costPrice"
                    value={formData.costPriceDisplay}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                      errors.costPrice 
                        ? 'border-red-500 focus:border-red-400' 
                        : isDarkMode
                          ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                          : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                    }`}
                    placeholder={currency === 'UZS' ? '800,000' : '62.50'}
                  />
                </div>

                {/* Sotish narxi */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {t('Sotish narxi', language)}
                  </label>
                  <input
                    type="text"
                    name="sellingPrice"
                    value={formData.sellingPriceDisplay}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                      errors.sellingPrice 
                        ? 'border-red-500 focus:border-red-400' 
                        : isDarkMode
                          ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                          : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                    }`}
                    placeholder={currency === 'UZS' ? '1,000,000' : '78.13'}
                  />
                </div>
              </div>

              {/* Foyda */}
              {formData.costPrice && formData.sellingPrice && Number(formData.sellingPrice) >= Number(formData.costPrice) && (
                <div className={`rounded p-2 mt-2 border ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border-green-700/50'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      isDarkMode ? 'text-green-400' : 'text-green-700'
                    }`}>{t('Foyda', language)}:</span>
                    <span className={`text-sm font-bold ${
                      isDarkMode ? 'text-green-300' : 'text-green-800'
                    }`}>
                      {formatNumber((Number(formData.sellingPrice) - Number(formData.costPrice)).toString())} {currency === 'UZS' ? t("so'm", language) : 'USD'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6-QADAM: Miqdor - IXCHAM */}
          {(formData.costPrice || formData.sellingPrice) && (
            <div className="transition-all duration-300 ease-in-out">
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Miqdor', language)} *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                  errors.quantity 
                    ? 'border-red-500 focus:border-red-400' 
                    : isDarkMode
                      ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500'
                      : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.quantity}
                </p>
              )}
            </div>
          )}

          {/* 7-QADAM: Rasm yuklash (ixtiyoriy) */}
          {formData.quantity && (
            <div className="transition-all duration-300 ease-in-out">
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Rasm', language)} ({t('ixtiyoriy', language)})
              </label>
              
              {/* Rasm yuklash yoki URL kiritish */}
              <div className="space-y-2">
                {/* Tab buttons */}
                <div className={`flex gap-1 p-0.5 rounded border ${
                  isDarkMode ? 'bg-gray-800 border-red-900/30' : 'bg-gray-100 border-orange-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      // URL tab
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      !imageFile && !imagePreview
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      <span>{t('URL', language)}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Upload tab
                      document.getElementById('image-upload')?.click();
                    }}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      imageFile || imagePreview
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3" />
                      <span>{t('Yuklash', language)}</span>
                    </div>
                  </button>
                </div>

                {/* URL input */}
                {!imageFile && !imagePreview && (
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder={t('Rasm URL manzilini kiriting', language)}
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                      isDarkMode
                        ? 'border-red-900/30 bg-gray-800 text-white focus:border-red-500 placeholder-gray-500'
                        : 'border-orange-200 bg-white text-gray-900 focus:border-orange-500 placeholder-gray-400'
                    }`}
                  />
                )}

                {/* File upload (hidden) */}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* Image preview */}
                {(imagePreview || formData.imageUrl) && (
                  <div className={`relative rounded-lg border-2 overflow-hidden ${
                    isDarkMode ? 'border-red-900/30' : 'border-orange-200'
                  }`}>
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <p className={`text-[10px] ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  💡 {t('Max 5MB, jpg/png/gif/webp', language)}
                </p>
              </div>
            </div>
          )}

          {/* Buttons - IXCHAM */}
          <div className={`flex items-center gap-2 pt-3 border-t ${
            isDarkMode ? 'border-red-900/30' : 'border-orange-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 border-red-900/30 hover:bg-gray-700'
                  : 'text-gray-700 bg-white border-orange-200 hover:bg-gray-50'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              className={`flex-1 px-3 py-2 text-xs font-medium text-white rounded-lg transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-800 shadow-red-900/30'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/30'
              }`}
            >
              {t('Saqlash', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSparePartModal;