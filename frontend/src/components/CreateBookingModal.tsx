import React, { useState } from 'react';
import { X, Calendar, Phone, Car, User, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bookingData: any) => Promise<any>;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { isDarkMode } = useTheme();
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    licensePlate: '',
    carMake: '',
    carModel: '',
    carYear: new Date().getFullYear(),
    bookingDate: '',
    birthDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isOpen);

  // Yil variantlari
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  // Mashina markalari
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
    // Boshqa mashhur markalar
    'Chevrolet', 'Toyota', 'Nissan', 'Honda', 'Ford', 'Volkswagen', 'BMW', 'Audi',
    'Mazda', 'Subaru', 'Lexus', 'Mitsubishi', 'Suzuki', 'Peugeot', 'Renault', 'Fiat',
    'Opel', 'Skoda', 'Seat', 'Lada', 'UAZ', 'Geely', 'Chery', 'BYD', 'Great Wall',
    'Haval', 'Tata', 'Ashok Leyland', 'Eicher', 'Boshqa'
  ].sort();

  // Modal ochilganda state'larni tozalash
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        customerName: '',
        phoneNumber: '',
        licensePlate: '',
        carMake: '',
        carModel: '',
        carYear: new Date().getFullYear(),
        bookingDate: '',
        birthDate: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.phoneNumber || !formData.licensePlate) {
      toast.error(t('Barcha majburiy maydonlarni to\'ldiring', language));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const bookingData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        licensePlate: formData.licensePlate.toUpperCase(),
        ...(formData.carMake && formData.carMake.trim() !== '' && { carMake: formData.carMake }),
        ...(formData.carModel && formData.carModel.trim() !== '' && { carModel: formData.carModel }),
        ...(formData.carYear && { carYear: formData.carYear }),
        ...(formData.bookingDate && formData.bookingDate.trim() !== '' && { bookingDate: formData.bookingDate }),
        ...(formData.birthDate && formData.birthDate.trim() !== '' && { birthDate: formData.birthDate })
      };
      
      await onCreate(bookingData);
      
      onClose();
      
      setFormData({
        customerName: '',
        phoneNumber: '',
        licensePlate: '',
        carMake: '',
        carModel: '',
        carYear: new Date().getFullYear(),
        bookingDate: '',
        birthDate: '',
      });
      
      toast.success(t('Bron muvaffaqiyatli yaratildi', language));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        phoneNumber: formatted,
      });
    } else if (name === 'licensePlate') {
      setFormData({
        ...formData,
        licensePlate: value.toUpperCase(),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
      formattedNumber = '998' + phoneNumber;
    }
    
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 animate-fadeIn">
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden mx-2 sm:mx-0 transform transition-all animate-slideUp ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`relative overflow-hidden rounded-t-xl sm:rounded-t-2xl px-4 sm:px-6 py-3 sm:py-4 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
        }`}>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white bg-opacity-20 backdrop-blur-sm mr-2.5">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-white">{t('Yangi bron', language)}</h2>
                <p className={`text-xs hidden sm:block ${
                  isDarkMode ? 'text-red-100' : 'text-blue-100'
                }`}>
                  {t('Mijoz ma\'lumotlarini kiriting', language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Mijoz ismi */}
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Mijoz ismi', language)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                  }`}
                  placeholder={t('Alisher Navoiy', language)}
                />
              </div>
            </div>

            {/* Telefon raqami */}
            <div>
              <label htmlFor="phoneNumber" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Telefon raqam', language)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                  }`}
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            {/* Davlat raqami */}
            <div>
              <label htmlFor="licensePlate" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Davlat raqami', language)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Car className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm uppercase ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                  }`}
                  placeholder="01 A 123 BC"
                />
              </div>
            </div>

            {/* Mashina markasi */}
            <div>
              <label htmlFor="carMake" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Mashina markasi', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Car className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <select
                  id="carMake"
                  name="carMake"
                  value={formData.carMake}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm appearance-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  <option value="">{t('Tanlang', language)}</option>
                  {carMakes.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mashina modeli */}
            <div>
              <label htmlFor="carModel" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Mashina modeli', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Car className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  id="carModel"
                  name="carModel"
                  value={formData.carModel}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                  }`}
                  placeholder={t('Nexia 3', language)}
                />
              </div>
            </div>

            {/* Mashina yili */}
            <div>
              <label htmlFor="carYear" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Yil', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <select
                  id="carYear"
                  name="carYear"
                  value={formData.carYear}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm appearance-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bron sanasi */}
            <div>
              <label htmlFor="bookingDate" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Bron sanasi', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="date"
                  id="bookingDate"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 [color-scheme:dark]'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Tug'ilgan kun */}
            <div>
              <label htmlFor="birthDate" className={`block text-xs font-semibold mb-1.5 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t('Tug\'ilgan kun', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Gift className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 [color-scheme:dark]'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Tugmalar */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
              }`}
            >
              {isSubmitting ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBookingModal;
