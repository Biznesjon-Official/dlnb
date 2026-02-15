import React, { useState } from 'react';
import { X, Car, Package, Plus, Trash2, ChevronRight, Wrench, Box, Briefcase, FileText, User, Calendar, Clock, AlertTriangle, Warehouse, Truck, CheckCircle, DollarSign } from 'lucide-react';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useUsers } from '@/hooks/useUsers';
import { useCreateTask } from '@/hooks/useTasks';
import { useSpareParts } from '@/hooks/useSpareParts';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface CreateCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Part {
  name: string;
  quantity: number;
  price: number;
  category: 'part' | 'material' | 'labor';
  source: 'available' | 'tobring'; // Yangi field: bizda bor yoki keltirish
  // Balon ma'lumotlari (agar balon bo'lsa)
  sparePartCategory?: 'tire' | 'other';
  tireSize?: string;
  tireFullSize?: string;
  tireBrand?: string;
  tireType?: 'yozgi' | 'qishki' | 'universal';
}

interface UsedSparePart {
  sparePartId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ApprenticeAssignment {
  id: string;
  apprenticeId: string;
  percentage: number;
}

interface TaskItem {
  id: string;
  service: string;
  assignments: ApprenticeAssignment[];
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  payment: number;
}



const CreateCarModal: React.FC<CreateCarModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  
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
    ownerPhone: ''
  });
  
  // Ehtiyot qismlar va materiallar
  const [items, setItems] = useState<Part[]>([]);
  const [usedSpareParts, setUsedSpareParts] = useState<UsedSparePart[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [displayItemPrice, setDisplayItemPrice] = useState('0');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [tobringPrice, setTobringPrice] = useState(''); // Keltirish uchun pul
  const [displayTobringPrice, setDisplayTobringPrice] = useState('0'); // Keltirish uchun ko'rsatiladigan pul
  const [partSource, setPartSource] = useState<'available' | 'tobring'>('tobring'); // Bizda bor yoki Keltirish
  const [searchQuery, setSearchQuery] = useState('');
  
  // Barcha zapchastlarni oldindan yuklash (modal ochilganda)
  const { data: allSparePartsData } = useSpareParts({ 
    limit: 1000 // Barcha zapchastlar
  });
  
  // INSTANT qidiruv - kategoriya bo'yicha ham qidiradi!
  const filteredSpareParts = React.useMemo(() => {
    if (!allSparePartsData?.spareParts || searchQuery.length < 1) {
      return [];
    }
    
    const query = searchQuery.toLowerCase();
    return allSparePartsData.spareParts
      .filter((part: any) => {
        // Nom bo'yicha qidirish
        const nameMatch = part.name.toLowerCase().includes(query);
        
        // Kategoriya bo'yicha qidirish
        const categoryMatch = part.category && (
          (part.category === 'tire' && ('balon'.includes(query) || 'tire'.includes(query))) ||
          (part.category === 'other' && ('boshqa'.includes(query) || 'other'.includes(query)))
        );
        
        // Balon ma'lumotlari bo'yicha qidirish
        const tireMatch = part.category === 'tire' && (
          (part.tireSize && part.tireSize.toLowerCase().includes(query)) ||
          (part.tireFullSize && part.tireFullSize.toLowerCase().includes(query)) ||
          (part.tireBrand && part.tireBrand.toLowerCase().includes(query)) ||
          (part.tireType && part.tireType.toLowerCase().includes(query))
        );
        
        return nameMatch || categoryMatch || tireMatch;
      })
      .slice(0, 20); // Faqat 20 ta ko'rsatish - tezlik uchun
  }, [allSparePartsData, searchQuery]);

  // Agar omborda topilmasa, avtomatik "Keltirish" ga o'tish
  React.useEffect(() => {
    if (partSource === 'available' && searchQuery.length >= 2) {
      const hasResults = filteredSpareParts.length > 0;
      if (!hasResults) {
        // Omborda yo'q - avtomatik "Keltirish" ga o'tish
        const timer = setTimeout(() => {
          setPartSource('tobring');
          setItemName(searchQuery);
          toast(t('Omborda topilmadi. "Keltirish" rejimiga o\'tildi', language), {
            duration: 2000,
            icon: '🚚'
          });
        }, 300); // 300ms kutish
        return () => clearTimeout(timer);
      }
    }
  }, [filteredSpareParts, searchQuery, partSource, language, t]);
  
  // Vazifalar (Step 4)
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [_carServices, setCarServices] = useState<any[]>([]); // _ prefixi - ishlatilmayotgan o'zgaruvchi
  const [loadingServices, setLoadingServices] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  const { isOnline } = useCarsNew();
  const createTaskMutation = useCreateTask();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  
  // Faqat foizlik shogirtlarni filtrlash (kunlik ishchilar emas)
  const apprentices = React.useMemo(() => {
    const users = usersData?.users || [];
    const filtered = users.filter((u: any) => 
      u.role === 'apprentice' && u.paymentType !== 'daily'
    );
    console.log('👥 Foizlik shogirtlar:', filtered);
    return filtered;
  }, [usersData]);
  
  useBodyScrollLock(isOpen);

  // Modal ochilganda state'larni tozalash
  React.useEffect(() => {
    if (isOpen) {
      // Barcha state'larni tozalash
      setCurrentStep(1);
      setFormData({
        make: '',
        carModel: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        ownerName: '',
        ownerPhone: ''
      });
      setItems([]);
      setUsedSpareParts([]);
      setTasks([]);
      setCarServices([]);
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
      setTobringPrice('');
      setDisplayTobringPrice('0');
      setPartSource('available');
      setSearchQuery('');
    }
  }, [isOpen]);

  // laborItems va partsAndMaterials ni olish
  const partsAndMaterials = items.filter(item => item.category !== 'labor');
  const laborItems = items.filter(item => item.category === 'labor');

  // Step 4 ga o'tganda xizmatlarni yuklash
  React.useEffect(() => {
    const loadCarServices = async () => {
      if (currentStep === 4) {
        setLoadingServices(true);
        try {
          // YANGI MASHINA QO'SHAYOTGANDA - faqat laborItems dan olish
          // createdCarId faqat mashina yaratilgandan KEYIN to'ldiriladi
          console.log('� LaborItems dan xizmatlar olinmoqda');
          const currentLaborItems = items.filter(item => item.category === 'labor');
          const services = currentLaborItems.map((item, index) => ({
            _id: `temp-${index}`, // Vaqtinchalik ID
            name: item.name,
            description: 'Ish haqi',
            price: item.price,
            category: 'labor',
            quantity: 1
          }));
          console.log('✅ Xizmatlar tayyor:', services);
          setCarServices(services);
        } catch (error: any) {
          console.error('❌ Xizmatlarni yuklashda xatolik:', error);
          setCarServices([]);
        } finally {
          setLoadingServices(false);
        }
      }
    };

    loadCarServices();
  }, [currentStep, items]); // items dependency qo'shamiz

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, '');
    const numValue = parseInt(value) || 0;
    
    setItemPrice(numValue.toString());
    setDisplayItemPrice(numValue === 0 ? '0' : formatNumber(numValue));
  };

  const handlePriceFocus = () => {
    if (itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('');
    }
  };

  const handlePriceBlur = () => {
    if (displayItemPrice === '' || itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('0');
      setItemPrice('0');
    }
  };

  // Autocomplete functions
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
    setSearchQuery(value);
  };

  const selectSparePart = (sparePart: any) => {
    setItemName(sparePart.name);
    setItemPrice(sparePart.price.toString());
    setDisplayItemPrice(formatNumber(sparePart.price));
    setSearchQuery(sparePart.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  // Ish haqi o'zgarganda to'lov avtomatik yangilansin - olib tashlandi

  const addItem = () => {
    if (itemName && itemQuantity) {
      const quantity = parseInt(itemQuantity) || 1;
      
      if (partSource === 'available') {
        // Bizda bor - ombordagi zapchastdan
        const price = parseFloat(itemPrice) || 0;
        
        if (price === 0) {
          toast.error(t('Narxni kiriting', language));
          return;
        }
        
        // Ombordagi zapchastni topish
        const sparePart = allSparePartsData?.spareParts?.find(
          (sp: any) => sp.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (sparePart) {
          // Zapchast topildi - usedSpareParts ga qo'shish
          setUsedSpareParts(prev => [...prev, {
            sparePartId: sparePart._id,
            name: sparePart.name,
            quantity: quantity,
            unitPrice: price,
            totalPrice: price * quantity
          }]);
        }
        
        // Items ga qo'shish (UI uchun)
        setItems(prev => [...prev, {
          name: itemName,
          price: price,
          quantity: quantity,
          category: 'part',
          source: 'available'
        }]);
        
        toast.success(t('Qism qo\'shildi (Bizda bor)', language));
      } else {
        // Keltirish - mijoz keltiradi
        const price = parseFloat(tobringPrice) || 0;
        
        // Items ga qo'shish (UI uchun)
        setItems(prev => [...prev, {
          name: itemName,
          price: price,
          quantity: quantity,
          category: 'part',
          source: 'tobring'
        }]);
        
        toast.success(t('Qism qo\'shildi (Keltirish)', language));
      }
      
      // Reset form
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
      setTobringPrice('');
      setDisplayTobringPrice('0');
      setSearchQuery('');
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Task functions (Step 4)
  const addTask = () => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      service: '',
      assignments: [],
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 1,
      payment: 0
    };
    setTasks([...tasks, newTask]);
  };

  const addApprentice = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: [
            ...task.assignments,
            {
              id: Date.now().toString(),
              apprenticeId: '',
              percentage: 50
            }
          ]
        };
      }
      return task;
    }));
  };

  const removeApprentice = (taskId: string, assignmentId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.filter(a => a.id !== assignmentId)
        };
      }
      return task;
    }));
  };

  const updateApprentice = (taskId: string, assignmentId: string, field: 'apprenticeId' | 'percentage', value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              if (field === 'apprenticeId' && value) {
                const selectedApprentice = apprentices.find((a: any) => a._id === value);
                const apprenticePercentage = selectedApprentice?.percentage || 50;
                return { 
                  ...assignment, 
                  apprenticeId: value,
                  percentage: apprenticePercentage 
                };
              }
              return assignment;
            }
            return assignment;
          })
        };
      }
      return task;
    }));
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId: string, field: keyof TaskItem, value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, [field]: value };
      }
      return task;
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'part': return <Wrench className="h-4 w-4" />;
      case 'material': return <Box className="h-4 w-4" />;
      case 'labor': return <Briefcase className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'part': return 'bg-blue-100 text-blue-700';
      case 'material': return 'bg-green-100 text-green-700';
      case 'labor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatsiya
    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
      alert('Barcha maydonlarni to\'ldiring');
      return;
    }

    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
      return;
    }

    const plateClean = formData.licensePlate.replace(/\s/g, '');
    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
    
    if (!isOldFormat && !isNewFormat) {
      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
      return;
    }
    
    // Vazifalar validatsiyasi (agar qo'shilgan bo'lsa)
    if (tasks.length > 0) {
      for (const task of tasks) {
        if (!task.title || !task.dueDate || task.assignments.length === 0) {
          alert(`Vazifa "${task.title || 'Noma\'lum'}" uchun barcha majburiy maydonlarni to'ldiring`);
          return;
        }
        
        for (const assignment of task.assignments) {
          if (!assignment.apprenticeId) {
            alert(`Vazifa "${task.title}" uchun barcha shogirdlarni tanlang`);
            return;
          }
        }
      }
    }
    
    try {
      // 1. Mashinani yaratish
      const totalEstimate = partsAndMaterials.reduce((sum, part) => sum + (part.price * part.quantity), 0) +
                           laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const carData = {
        make: formData.make,
        carModel: formData.carModel,
        year: formData.year,
        licensePlate: formData.licensePlate,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        totalEstimate,
        paidAmount: 0,
        parts: partsAndMaterials.map(part => ({
          name: part.name,
          quantity: part.quantity,
          price: part.price,
          status: 'needed' as const
        })),
        serviceItems: laborItems.map(item => ({
          name: item.name,
          description: 'Ish haqi',
          price: item.price,
          quantity: item.quantity,
          category: 'labor' as const
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Mashinani yaratish
      console.log('📤 Mashina yaratilmoqda:', carData);
      
      let carId: string;
      
      // To'g'ridan-to'g'ri API ga so'rov yuborish (optimistic update o'rniga)
      try {
        const response = await api.post('/cars', carData);
        carId = response.data.car._id;
        console.log('✅ Mashina yaratildi, ID:', carId);
      } catch (err: any) {
        console.error('❌ Mashina yaratishda xatolik:', err);
        throw err;
      }
      
      if (!carId) {
        throw new Error('Mashina yaratildi, lekin ID topilmadi');
      }

      // 2. Agar vazifalar bo'lsa, ularni yaratish
      if (tasks.length > 0) {
        setIsCreatingTasks(true);
        for (const task of tasks) {
          const taskData: any = {
            title: task.title,
            description: task.description || task.title,
            car: carId,
            // CreateCarModal'da xizmatlar hali backend'ga saqlanmagan, shuning uchun service field'ini yubormaymiz
            // service: undefined,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedHours: task.estimatedHours,
            payment: task.payment
          };
          
          // Assignments formatini to'g'rilash
          if (task.assignments && task.assignments.length > 0) {
            taskData.assignments = task.assignments.map(a => ({
              apprenticeId: a.apprenticeId
            }));
          }
          
          console.log('📤 Vazifa yuborilmoqda:', taskData);
          
          await createTaskMutation.mutateAsync(taskData);
        }
        setIsCreatingTasks(false);
        
        toast.success(t(`Mashina va ${tasks.length} ta vazifa yaratildi!`, language));
      } else {
        toast.success(t('Mashina muvaffaqiyatli yaratildi!', language));
      }

      // Reset
      setFormData({
        make: '',
        carModel: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        ownerName: '',
        ownerPhone: ''
      });
      setItems([]);
      setUsedSpareParts([]);
      setTasks([]);
      setCurrentStep(1);
      
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating car:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        toast.error(`Xatolik: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(`Xatolik: ${error.response.data.message}`);
      } else {
        toast.error(error.message || 'Xatolik yuz berdi');
      }
    }
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ownerPhone') {
      // Telefon raqamini formatlash
      const phoneValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else if (name === 'licensePlate') {
      // Davlat raqamini formatlash
      const plateValue = formatLicensePlate(value);
      setFormData(prev => ({
        ...prev,
        [name]: plateValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' ? Number(value) : value
      }));
    }
  };

  const formatLicensePlate = (value: string) => {
    // Faqat raqam va harflarni qoldirish
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // O'zbekiston davlat raqami formatlari:
    // Eski format: 01A123BC (2 raqam + 1 harf + 3 raqam + 2 harf)
    // Yangi format: 01123ABC (2 raqam + 3 raqam + 3 harf)
    
    if (cleanValue.length <= 8) {
      // Eski format: 01A123BC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 3); // A
        }
        if (cleanValue.length > 3) {
          formatted += ' ' + cleanValue.slice(3, 6); // 123
        }
        if (cleanValue.length > 6) {
          formatted += ' ' + cleanValue.slice(6, 8); // BC
        }
        return formatted;
      }
    } else {
      // Yangi format: 01123ABC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 5); // 123
        }
        if (cleanValue.length > 5) {
          formatted += ' ' + cleanValue.slice(5, 8); // ABC
        }
        return formatted;
      }
    }
    
    return cleanValue;
  };

  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const phoneNumber = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa, avtomatik qo'shish
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
      formattedNumber = '998' + phoneNumber;
    }
    
    // Formatni qo'llash: +998 XX XXX XX XX
    if (formattedNumber.length >= 3) {
      let formatted = '+998';
      if (formattedNumber.length > 3) {
        formatted += ' ' + formattedNumber.slice(3, 5);
      }
      if (formattedNumber.length > 5) {
        formatted += ' ' + formattedNumber.slice(5, 8);
      }
      if (formattedNumber.length > 8) {
        formatted += ' ' + formattedNumber.slice(8, 10);
      }
      if (formattedNumber.length > 10) {
        formatted += ' ' + formattedNumber.slice(10, 12);
      }
      return formatted;
    }
    
    return formattedNumber.length > 0 ? '+' + formattedNumber : '';
  };

  if (!isOpen) return null;

  // Yil variantlari
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
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-white'
      }`}>
        {/* Header - Compact */}
        <div className={`relative px-4 py-2.5 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-orange-600 to-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                {currentStep === 1 && <Car className="h-4 w-4 text-white" />}
                {currentStep === 2 && <Package className="h-4 w-4 text-white" />}
                {currentStep === 3 && <Briefcase className="h-4 w-4 text-white" />}
                {currentStep === 4 && <FileText className="h-4 w-4 text-white" />}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  {currentStep === 1 && t('Yangi mashina', language)}
                  {currentStep === 2 && t('Zapchastlar', language)}
                  {currentStep === 3 && t('Ish haqi', language)}
                  {currentStep === 4 && t('Vazifalar', language)}
                  {(!isOnline) && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-orange-500 text-white rounded-full">
                      Offline
                    </span>
                  )}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps - Compact */}
        <div className={`border-b px-3 py-2 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center hover:scale-105 transition-transform group"
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                currentStep === 1 
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg'
                    : 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg' 
                  : currentStep > 1 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' 
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
              } font-bold transition-all text-xs`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
            </button>
            
            <div className={`h-0.5 w-8 rounded-full ${
              currentStep > 1 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            } transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center hover:scale-105 transition-transform group"
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                currentStep === 2 
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg'
                    : 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg' 
                  : currentStep > 2 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' 
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
              } font-bold transition-all text-xs`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
            </button>
            
            <div className={`h-0.5 w-8 rounded-full ${
              currentStep > 2 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            } transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center hover:scale-105 transition-transform group"
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                currentStep === 3 
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg'
                    : 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg' 
                  : currentStep > 3 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' 
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
              } font-bold transition-all text-xs`}>
                {currentStep > 3 ? '✓' : '3'}
              </div>
            </button>
            
            <div className={`h-0.5 w-8 rounded-full ${
              currentStep > 3 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            } transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center hover:scale-105 transition-transform group"
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                currentStep === 4 
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg'
                    : 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg' 
                  : currentStep > 4 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' 
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
              } font-bold transition-all text-xs`}>
                {currentStep > 4 ? '✓' : '4'}
              </div>
            </button>
          </div>
        </div>

        {/* Content - Compact with fixed height */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentStep === 1 ? (
            // TAB 1: Mashina ma'lumotlari
            <div className="space-y-4">
              <div className={`rounded-xl p-4 shadow-sm border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-orange-600 to-orange-500'
                  }`}>
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${
                      isDarkMode ? 'text-red-400' : 'text-orange-900'
                    }`}>
                      {t("Mashina ma'lumotlari", language)}
                    </h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-red-300' : 'text-orange-600'
                    }`}>
                      {t("Asosiy ma'lumotlarni kiriting", language)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('Marka', language)} *
                  </label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('Model', language)} *
                  </label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                    }`}
                    placeholder="Lacetti"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('Yili', language)} *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('Davlat raqami', language)} *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    maxLength={11}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                    }`}
                    placeholder="01 A 123 BC"
                  />
                </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 shadow-sm border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-orange-600 to-orange-500'
                  }`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${
                      isDarkMode ? 'text-red-400' : 'text-orange-900'
                    }`}>
                      {t('Egasi', language)}
                    </h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-red-300' : 'text-orange-600'
                    }`}>
                      {t("Mashina egasi haqida ma'lumot", language)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('Ism', language)} *
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('Telefon', language)} *
                    </label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      maxLength={17}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            // QISM 2: Ehtiyot qismlar va materiallar
            <>
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 mb-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-600'
                  : 'bg-orange-50 border-orange-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                      {t('Zapchast qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 mb-3 shadow-sm border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-orange-600 to-orange-500'
                  }`}>
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                      {t("Zapchast qo'shish", language)}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-orange-600'}`}>
                      {t("Kerakli qismlarni ro'yxatga oling (ixtiyoriy)", language)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Ixcham checkbox tugmalar */}
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      partSource === 'available' 
                        ? isDarkMode
                          ? 'bg-red-900/30 border-red-600'
                          : 'bg-orange-100 border-orange-500'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700 hover:border-red-700'
                          : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}>
                      <input
                        type="radio"
                        name="partSource"
                        checked={partSource === 'available'}
                        onChange={() => {
                          setPartSource('available');
                          setTobringPrice('');
                          setDisplayTobringPrice('0');
                        }}
                        className={isDarkMode ? 'w-4 h-4 text-red-600' : 'w-4 h-4 text-orange-600'}
                      />
                      <Warehouse className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {t('Bizda bor', language)}
                      </span>
                    </label>
                    
                    <label className={`flex-1 flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                      partSource === 'tobring' 
                        ? isDarkMode
                          ? 'bg-red-900/30 border-red-600'
                          : 'bg-orange-100 border-orange-500'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700 hover:border-red-700'
                          : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}>
                      <input
                        type="radio"
                        name="partSource"
                        checked={partSource === 'tobring'}
                        onChange={() => {
                          setPartSource('tobring');
                          setItemPrice('');
                          setDisplayItemPrice('0');
                        }}
                        className={isDarkMode ? 'w-4 h-4 text-red-600' : 'w-4 h-4 text-orange-600'}
                      />
                      <Truck className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {t('Keltirish', language)}
                      </span>
                    </label>
                  </div>

                  {/* Ombor ro'yxati - INSTANT natija! */}
                  {partSource === 'available' && searchQuery.length >= 1 && (
                    <div className={`border rounded-lg p-2 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredSpareParts.length > 0 ? (
                          filteredSpareParts.map((sparePart: any) => (
                            <button
                              key={sparePart._id}
                              type="button"
                              onClick={() => selectSparePart(sparePart)}
                              className={`w-full px-2 py-1.5 text-left rounded flex items-center justify-between border transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-red-900/30 border-transparent hover:border-red-700'
                                  : 'hover:bg-orange-50 border-transparent hover:border-orange-200'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    {sparePart.name}
                                  </p>
                                  {sparePart.category === 'tire' && (
                                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded flex items-center gap-1 ${
                                      isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <Car className="h-3 w-3" />
                                      Balon
                                    </span>
                                  )}
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Package className="h-3 w-3" />
                                  <span>{sparePart.quantity} dona</span>
                                  {sparePart.category === 'tire' && sparePart.tireSize && (
                                    <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                                      R{sparePart.tireSize}
                                    </span>
                                  )}
                                  {sparePart.category === 'tire' && sparePart.tireBrand && (
                                    <span className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-orange-500'}`}>
                                      {sparePart.tireBrand}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-bold ml-2 whitespace-nowrap ${
                                isDarkMode ? 'text-red-400' : 'text-orange-600'
                              }`}>
                                {formatCurrency(sparePart.price)}
                              </span>
                            </button>
                          ))
                        ) : allSparePartsData?.spareParts ? (
                          <p className={`text-center text-sm py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('Topilmadi', language)}
                          </p>
                        ) : (
                          <p className={`text-center text-sm py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('Yuklanmoqda...', language)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Qism nomi - qidiruv */}
                  {partSource === 'available' && (
                    <input
                      type="text"
                      value={searchQuery} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        setItemName(value);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t("Qism nomini kiriting...", language)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                  )}

                  {/* Qism nomi - keltirish */}
                  {partSource === 'tobring' && (
                    <input
                      type="text"
                      value={itemName} 
                      onChange={handleItemNameChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t("Qism nomi", language)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                  )}

                  {/* Narx - Bizda bor */}
                  {partSource === 'available' && itemName && (
                    <input
                      type="text"
                      value={displayItemPrice}
                      onChange={handlePriceChange}
                      onFocus={handlePriceFocus}
                      onBlur={handlePriceBlur}
                      placeholder={t('Narxi', language)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-orange-50 border-orange-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                  )}

                  {/* Mijoz puli - Keltirish */}
                  {partSource === 'tobring' && itemName && (
                    <input
                      type="text"
                      value={displayTobringPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        const numValue = parseInt(value) || 0;
                        setTobringPrice(numValue.toString());
                        setDisplayTobringPrice(numValue === 0 ? '0' : formatNumber(numValue));
                      }}
                      onFocus={() => {
                        if (tobringPrice === '0' || !tobringPrice) {
                          setDisplayTobringPrice('');
                        }
                      }}
                      onBlur={() => {
                        if (displayTobringPrice === '' || tobringPrice === '0' || !tobringPrice) {
                          setDisplayTobringPrice('0');
                          setTobringPrice('0');
                        }
                      }}
                      placeholder={t('Mijoz puli (ixtiyoriy)', language)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                        isDarkMode
                          ? 'bg-gray-800 border-red-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                          : 'bg-orange-50 border-orange-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                      }`}
                    />
                  )}

                  {/* Soni va Qo'shish */}
                  {itemName && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder={t("Soni", language)}
                        min="1"
                        className={`w-20 px-3 py-2 text-sm border rounded-lg transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName || (partSource === 'available' && !itemPrice)}
                        className={`flex-1 px-4 py-2 text-white text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900'
                            : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        {t("Qo'shish", language)}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Parts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                    {t("Qismlar ro'yxati", language)}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {partsAndMaterials.length} ta
                  </span>
                </div>
                
                {partsAndMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {partsAndMaterials.map((item, index) => {
                      // Ushbu item zapchast ekanligini tekshirish
                      const correspondingUsedPart = usedSpareParts.find(up => up.name === item.name);
                      const isFromSpareParts = !!correspondingUsedPart;
                      const isToBring = item.source === 'tobring';
                      
                      return (
                        <div key={index} className={`border-2 rounded-lg p-3 transition-all ${
                          isToBring 
                            ? isDarkMode
                              ? 'bg-red-900/20 border-red-800 hover:border-red-700'
                              : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                            : isDarkMode
                              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(item.category)}
                                <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {item.name}
                                </p>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {item.category === 'part' ? t('Qism', language) : t('Material', language)}
                                </span>
                                {isToBring ? (
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 ${
                                    isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    <Truck className="h-3 w-3" />
                                    {t('Keltirish', language)}
                                  </span>
                                ) : isFromSpareParts && (
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 ${
                                    isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    <Package className="h-3 w-3" />
                                    Zapchast
                                  </span>
                                )}
                              </div>
                              <div className={`flex items-center gap-3 ml-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="text-xs">{item.quantity} dona</span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>×</span>
                                <span className={`text-xs font-bold ${
                                  isToBring 
                                    ? isDarkMode ? 'text-red-400' : 'text-orange-600'
                                    : isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  {isToBring 
                                    ? (item.price > 0 
                                        ? `${formatCurrency(item.price)} (keltirish uchun berildi)` 
                                        : t('Mijoz keltiradi (0 so\'m)', language))
                                    : formatCurrency(item.price)
                                  }
                                </span>
                                {!isToBring && (
                                  <>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>=</span>
                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                      {formatCurrency(item.price * item.quantity)}
                                    </span>
                                  </>
                                )}
                                {isToBring && item.price > 0 && (
                                  <>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>=</span>
                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                                      {formatCurrency(item.price * item.quantity)}
                                    </span>
                                  </>
                                )}
                                {isFromSpareParts && !isToBring && (
                                  <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-blue-600'}`}>
                                    (Zapchastlar sonidan kamayadi)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className={`p-2 rounded-lg ml-2 transition-colors ${
                                isDarkMode
                                  ? 'text-red-400 hover:bg-red-900/30'
                                  : 'text-red-600 hover:bg-red-100'
                              }`}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className={`rounded-lg p-4 border ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {t('Jami:', language)}
                        </span>
                        <span className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(partsAndMaterials.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <Package className={`h-10 w-10 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t("Qismlar qo'shilmagan", language)}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : currentStep === 3 ? (
            // QISM 3: Ish haqi
            <>
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 mb-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-600'
                  : 'bg-orange-50 border-orange-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                      {t('Ish haqi qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-orange-600 to-orange-500'
                  }`}>
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                      {t("Ish haqi qo'shish", language)}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-orange-600'}`}>
                      {t("Bajarilgan ishlar uchun to'lov (ixtiyoriy)", language)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${
                        isDarkMode ? 'text-red-300' : 'text-orange-700'
                      }`}>
                        {t('Ish nomi', language)} *
                      </label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder={t("Masalan: Balon tuzatish", language)}
                        className={`w-full px-3 py-2.5 border-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                            : 'bg-white border-orange-200 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${
                        isDarkMode ? 'text-red-300' : 'text-orange-700'
                      }`}>
                        {t("Narxi (dona)", language)} *
                      </label>
                      <input
                        type="text"
                        value={displayItemPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="10,000"
                        className={`w-full px-3 py-2.5 border-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                            : 'bg-white border-orange-200 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${
                        isDarkMode ? 'text-red-300' : 'text-orange-700'
                      }`}>
                        {t("Soni", language)} *
                      </label>
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        min="1"
                        placeholder="1"
                        className={`w-full px-3 py-2.5 border-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500'
                            : 'bg-white border-orange-200 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Jami summa ko'rsatish */}
                  {itemPrice && itemQuantity && parseFloat(itemPrice) > 0 && parseInt(itemQuantity) > 0 && (
                    <div className={`border-2 rounded-lg p-3 ${
                      isDarkMode
                        ? 'bg-red-900/30 border-red-700'
                        : 'bg-orange-100 border-orange-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                          {t('Jami:', language)}
                        </span>
                        <span className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                          {formatCurrency(parseFloat(itemPrice) * parseInt(itemQuantity))}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (itemName) {
                        // Agar pul kiritilmagan bo'lsa, 0 qo'yamiz
                        const price = itemPrice && parseFloat(itemPrice) > 0 ? parseFloat(itemPrice) : 0;
                        const quantity = itemQuantity && parseInt(itemQuantity) > 0 ? parseInt(itemQuantity) : 1;
                        
                        setItems(prev => [...prev, {
                          name: itemName,
                          description: '',
                          price: price,
                          quantity: quantity,
                          category: 'labor',
                          source: 'available' // Ish haqi har doim bizda bor
                        }]);
                        setItemName('');
                        setItemPrice('');
                        setDisplayItemPrice('0');
                        setItemQuantity('1');
                      }
                    }}
                    disabled={!itemName}
                    className={`w-full px-4 py-3 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900'
                        : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    {t("Ish haqi qo'shish", language)}
                  </button>
                </div>
              </div>

              {/* Labor Items List - Yaxshilangan dizayn */}
              {laborItems.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                      <h4 className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                        {t("Ish haqi ro'yxati", language)}
                      </h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {laborItems.length} ta
                    </span>
                  </div>
                  <div className="space-y-2">
                    {laborItems.map((item, index) => (
                      <div key={index} className={`border-2 rounded-lg p-4 hover:shadow-md transition-all ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-red-900/30'
                          : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isDarkMode
                                ? 'bg-gradient-to-br from-red-600 to-red-800'
                                : 'bg-gradient-to-br from-orange-600 to-orange-500'
                            }`}>
                              <Briefcase className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                {item.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                                {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className={`p-2 rounded-lg transition-all ${
                                isDarkMode
                                  ? 'text-red-400 hover:bg-red-900/30'
                                  : 'text-red-600 hover:bg-red-100'
                              }`}
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Jami ish haqi */}
                    <div className={`rounded-lg p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-700'
                        : 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isDarkMode ? 'text-red-300' : 'text-orange-900'}`}>
                          {t('Jami ish haqi:', language)}
                        </span>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                          {formatCurrency(laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : currentStep === 4 ? (
            // QISM 4: Vazifalar
            <>
              {/* Ixtiyoriy xabar */}
              <div className={`border-l-4 p-3 mb-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-600'
                  : 'bg-orange-50 border-orange-500'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>
                      {t('Vazifa qo\'shmasangiz ham mashinani saqlashingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vazifalar qo'shish */}
              <div className={`rounded-xl p-4 mb-3 shadow-sm border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
                  : 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : 'bg-gradient-to-br from-orange-600 to-orange-500'
                  }`}>
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-red-400' : 'text-orange-900'}`}>
                      {t("Vazifalar (ixtiyoriy)", language)}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-orange-600'}`}>
                      {t("Shogirdlarga vazifa topshirish", language)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addTask}
                  className={`w-full px-4 py-3 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900'
                      : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  {t("Vazifa qo'shish", language)}
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className={`text-center py-10 border-2 border-dashed rounded-xl ${
                  isDarkMode
                    ? 'border-red-900/30 bg-gradient-to-br from-gray-800 to-gray-900'
                    : 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100'
                }`}>
                  <div className={`inline-block p-4 rounded-full mb-4 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-900/50 to-red-800/50'
                      : 'bg-gradient-to-br from-orange-100 to-orange-200'
                  }`}>
                    <FileText className={`h-12 w-12 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                  </div>
                  <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t("Vazifalar qo'shilmagan", language)}
                  </p>
                  <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t("Bu qadam ixtiyoriy - o'tkazib yuborishingiz mumkin", language)}
                  </p>
                  
                  {/* Xizmatlar haqida ma'lumot */}
                  {loadingServices ? (
                    <div className={`mt-4 p-4 border-2 rounded-lg max-w-md mx-auto ${
                      isDarkMode
                        ? 'bg-red-900/20 border-red-700'
                        : 'bg-orange-50 border-orange-300'
                    }`}>
                      <div className="flex items-center justify-center gap-3">
                        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                          isDarkMode ? 'border-red-400' : 'border-orange-600'
                        }`}></div>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                          {t("Xizmatlar yuklanmoqda...", language)}
                        </p>
                      </div>
                    </div>
                  ) : laborItems.length > 0 ? (
                    <div className={`mt-4 p-3 border rounded-lg max-w-md mx-auto ${
                      isDarkMode
                        ? 'bg-red-900/20 border-red-800'
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDarkMode ? 'text-red-300' : 'text-orange-700'}`}>
                        <CheckCircle className="h-4 w-4" />
                        {laborItems.length} ta xizmat mavjud
                      </p>
                      <div className="text-xs text-blue-600 space-y-1">
                        {laborItems.slice(0, 3).map((item: Part, idx: number) => {
                          const totalPrice = (item.quantity || 1) * (item.price || 0);
                          return (
                            <div key={idx} className="flex items-center justify-between">
                              <span>• {item.name} ({item.quantity} ta)</span>
                              <span className="font-semibold">{totalPrice.toLocaleString()} {t("so'm", language)}</span>
                            </div>
                          );
                        })}
                        {laborItems.length > 3 && (
                          <p className="text-blue-500 font-medium">+{laborItems.length - 3} ta yana...</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                      <p className="text-xs text-amber-700">
                        ⚠️ {t("Bu mashina uchun xizmatlar topilmadi", language)}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {t("Zapchastlar va ish haqi qo'shilganmi tekshiring", language)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <div key={task.id} className={`rounded-xl p-4 space-y-3 shadow-lg hover:shadow-xl transition-all ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-2 border-red-900/50'
                        : 'bg-gradient-to-br from-white via-red-50 to-gray-50 border-2 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-red-600 to-red-800'
                              : 'bg-gradient-to-br from-red-600 to-red-700'
                          }`}>
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-red-400' : 'text-red-700'
                          }`}>
                            {t('Vazifa', language)} #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title={t("Vazifani o'chirish", language)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Xizmat tanlash */}
                      {laborItems.length > 0 ? (
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <Wrench className="h-3 w-3 inline mr-1" />
                            {t('Xizmat (ixtiyoriy)', language)}
                          </label>
                          <select
                            value={task.service}
                            onChange={(e) => {
                              const selectedItem = laborItems.find(item => item.name === e.target.value);
                              console.log('🔍 Tanlangan xizmat:', selectedItem);
                              console.log('📋 Barcha laborItems:', laborItems);
                              if (selectedItem) {
                                // Jami narxni hisoblash: quantity * price
                                const totalPayment = (selectedItem.quantity || 1) * (selectedItem.price || 0);
                                console.log('💰 Hisoblangan narx:', {
                                  quantity: selectedItem.quantity,
                                  price: selectedItem.price,
                                  totalPayment
                                });
                                
                                // Barcha ma'lumotlarni bir vaqtda yangilash
                                setTasks(tasks.map(t => {
                                  if (t.id === task.id) {
                                    return {
                                      ...t,
                                      service: e.target.value,
                                      title: selectedItem.name,
                                      payment: totalPayment
                                    };
                                  }
                                  return t;
                                }));
                              } else {
                                updateTask(task.id, 'service', '');
                              }
                            }}
                            className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 transition-colors ${
                              isDarkMode
                                ? 'bg-gray-800 border-2 border-red-900/50 text-white focus:ring-red-500 focus:border-red-500'
                                : 'bg-white border-2 border-red-200 text-gray-900 focus:ring-red-500 focus:border-red-400'
                            }`}
                          >
                            <option value="">{t('Xizmat tanlanmagan', language)}</option>
                            {laborItems.map((item: Part, idx: number) => {
                              const totalPrice = (item.quantity || 1) * (item.price || 0);
                              return (
                                <option key={idx} value={item.name}>
                                  {item.name} ({item.quantity} ta) - {totalPrice.toLocaleString()} {t("so'm", language)}
                                </option>
                              );
                            })}
                          </select>
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            💡 {t('Xizmat tanlasangiz, narx avtomatik to\'ldiriladi', language)}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-lg border-2 ${
                          isDarkMode
                            ? 'bg-red-900/20 border-red-800'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <p className={`text-xs font-medium ${
                            isDarkMode ? 'text-red-400' : 'text-red-700'
                          }`}>
                            ⚠️ {t("3-stepda xizmat qo'shing", language)}
                          </p>
                        </div>
                      )}

                      {/* Vazifa nomi */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {t('Vazifa nomi', language)} *
                        </label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                          placeholder={t("Masalan: Dvigatel ta'mirlash", language)}
                          className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 transition-colors ${
                            isDarkMode
                              ? 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-red-500 focus:border-red-400'
                          }`}
                        />
                      </div>

                      {/* Shogirdlar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className={`block text-xs font-semibold ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <User className="h-3 w-3 inline mr-1" />
                            {t('Shogirdlar', language)}
                          </label>
                          <button
                            type="button"
                            onClick={() => addApprentice(task.id)}
                            className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                              isDarkMode
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <Plus className="h-3 w-3" />
                            {t("Shogird qo'shish", language)}
                          </button>
                        </div>

                        {task.assignments.length === 0 ? (
                          <div className={`text-center py-4 rounded-lg border-2 border-dashed ${
                            isDarkMode
                              ? 'bg-gray-800/50 border-red-900/50'
                              : 'bg-gray-50 border-red-300'
                          }`}>
                            <User className={`h-8 w-8 mx-auto mb-2 ${
                              isDarkMode ? 'text-red-400' : 'text-red-400'
                            }`} />
                            <p className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{t("Shogird qo'shing", language)}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {task.assignments.map((assignment, idx) => {
                              const allocatedAmount = task.payment / task.assignments.length;
                              const earning = (allocatedAmount * assignment.percentage) / 100;
                              const masterShare = allocatedAmount - earning;

                              return (
                                <div key={assignment.id} className={`p-3 rounded-lg border-2 shadow-sm ${
                                  isDarkMode
                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-900/50'
                                    : 'bg-gradient-to-br from-red-50 to-gray-50 border-red-200'
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1 rounded ${
                                        isDarkMode
                                          ? 'bg-gradient-to-br from-red-600 to-red-800'
                                          : 'bg-gradient-to-br from-red-600 to-red-700'
                                      }`}>
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                      <span className={`text-xs font-bold ${
                                        isDarkMode ? 'text-red-400' : 'text-red-700'
                                      }`}>{t('Shogird', language)} #{idx + 1}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeApprentice(task.id, assignment.id)}
                                      className={`p-1.5 rounded transition-all ${
                                        isDarkMode
                                          ? 'text-red-400 hover:bg-red-900/30'
                                          : 'text-red-600 hover:bg-red-100'
                                      }`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <select
                                        value={assignment.apprenticeId}
                                        onChange={(e) => updateApprentice(task.id, assignment.id, 'apprenticeId', e.target.value)}
                                        className={`w-full px-2 py-1 text-xs rounded focus:ring-1 ${
                                          isDarkMode
                                            ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                            : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                                        }`}
                                        disabled={usersLoading}
                                      >
                                        <option value="">
                                          {usersLoading ? t('Yuklanmoqda...', language) : t('Tanlang', language)}
                                        </option>
                                        {apprentices.map((apprentice: any) => (
                                          <option key={apprentice._id} value={apprentice._id}>
                                            {apprentice.name} ({apprentice.percentage || 50}%)
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <input
                                        type="number"
                                        value={assignment.percentage}
                                        readOnly
                                        disabled
                                        className={`w-full px-2 py-1 text-xs rounded cursor-not-allowed ${
                                          isDarkMode
                                            ? 'bg-gray-900 border border-gray-700 text-gray-500'
                                            : 'bg-gray-100 border border-gray-300 text-gray-600'
                                        }`}
                                        placeholder={t("Foiz %", language)}
                                        title={t("Ustoz tomonidan belgilangan foiz", language)}
                                      />
                                    </div>
                                  </div>

                                  {task.payment > 0 && assignment.percentage > 0 && (
                                    <div className={`mt-2 p-2 rounded text-xs space-y-1 ${
                                      isDarkMode ? 'bg-gray-900/50' : 'bg-white'
                                    }`}>
                                      <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('Ajratilgan:', language)}</span>
                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{allocatedAmount.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>{t('Shogird', language)} ({assignment.percentage}%):</span>
                                        <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{earning.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>{t('Ustoz:', language)}</span>
                                        <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{masterShare.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Qo'shimcha ma'lumotlar */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {t('Muhimlik', language)}
                          </label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                            className={`w-full px-2 py-1 text-xs rounded focus:ring-1 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                            }`}
                          >
                            <option value="low">{t('Past', language)}</option>
                            <option value="medium">{t("O'rta", language)}</option>
                            <option value="high">{t('Yuqori', language)}</option>
                            <option value="urgent">{t('Shoshilinch', language)}</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {t('Muddat', language)}
                          </label>
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-2 py-1 text-xs rounded focus:ring-1 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {t('Soat', language)}
                          </label>
                          <input
                            type="number"
                            value={task.estimatedHours}
                            onChange={(e) => updateTask(task.id, 'estimatedHours', Number(e.target.value))}
                            min="0.5"
                            step="0.5"
                            className={`w-full px-2 py-1 text-xs rounded focus:ring-1 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 flex items-center gap-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <DollarSign className="h-3 w-3" />
                            {t("To'lov", language)}
                          </label>
                          <input
                            type="number"
                            value={task.payment}
                            onChange={(e) => updateTask(task.id, 'payment', Number(e.target.value))}
                            min="0"
                            className={`w-full px-2 py-1 text-xs rounded focus:ring-1 ${
                              isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-red-500'
                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-red-500'
                            }`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer - Compact */}
        <div className={`border-t-2 px-4 py-3 flex items-center justify-between ${
          isDarkMode
            ? 'bg-gray-800 border-red-900/30'
            : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
        }`}>
          {/* Left side - Back button (only show if not on first step) */}
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 border-2 ${
                  isDarkMode
                    ? 'text-red-400 hover:bg-red-900/30 border-red-800'
                    : 'text-orange-700 hover:bg-orange-100 border-orange-300'
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span>{t('Orqaga', language)}</span>
              </button>
            )}
          </div>

          {/* Right side - Cancel and Next/Save buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all border-2 ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 border-gray-700'
                  : 'text-gray-700 hover:bg-white border-gray-300'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={async () => {
                  // Validate current step before moving to next
                  if (currentStep === 1) {
                    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
                      alert('Barcha maydonlarni to\'ldiring');
                      return;
                    }
                    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
                    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
                      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
                      return;
                    }
                    const plateClean = formData.licensePlate.replace(/\s/g, '');
                    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
                    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
                    if (!isOldFormat && !isNewFormat) {
                      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
                      return;
                    }
                  }
                  
                  // Faqat keyingi stepga o'tish (mashina yaratmasdan)
                  setCurrentStep(currentStep + 1);
                }}
                className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900'
                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                }`}
              >
                <span>{t('Keyingi', language)}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isCreatingTasks}
                className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900'
                    : 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 hover:from-green-700 hover:via-emerald-600 hover:to-teal-600'
                }`}
              >
                {isCreatingTasks ? t('Saqlanmoqda...', language) : (tasks.length > 0 ? t('Vazifalarni saqlash', language) : t('Tugatish', language))}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCarModal;