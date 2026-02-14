import React, { useState, useEffect } from 'react';
import { X, Calendar, Phone, Car, User, } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

interface Booking {
  _id: string;
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  bookingDate: string;
  birthDate?: string; // Tug'ilgan kun
  status: string;
}

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onUpdate: (id: string, bookingData: any) => Promise<any>;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ isOpen, onClose, booking, onUpdate }) => {
  const { isDarkMode } = useTheme();
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    licensePlate: '',
    bookingDate: '',
    birthDate: '', // Tug'ilgan kun
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      let formattedDate = '';
      if (booking.bookingDate) {
        const date = new Date(booking.bookingDate);
        formattedDate = date.toISOString().slice(0, 10); // YYYY-MM-DD format
      }
      
      let formattedBirthDate = '';
      if (booking.birthDate) {
        const birthDate = new Date(booking.birthDate);
        formattedBirthDate = birthDate.toISOString().slice(0, 10);
      }
      
      // Telefon raqamini formatlash
      const formattedPhone = formatPhoneNumber(booking.phoneNumber);
      
      setFormData({
        customerName: booking.customerName,
        phoneNumber: formattedPhone,
        licensePlate: booking.licensePlate,
        bookingDate: formattedDate,
        birthDate: formattedBirthDate,
      });
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.phoneNumber || !formData.licensePlate) {
      toast.error(t('Barcha majburiy maydonlarni to\'ldiring', language));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Bo'sh string'larni undefined'ga o'zgartirish (backend uchun)
      const bookingData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        licensePlate: formData.licensePlate,
        ...(formData.bookingDate && formData.bookingDate.trim() !== '' && { bookingDate: formData.bookingDate }),
        ...(formData.birthDate && formData.birthDate.trim() !== '' && { birthDate: formData.birthDate })
      };
      
      // ⚡ INSTANT: Modal darhol yopiladi
      onClose();
      
      // Background'da yangilash
      await onUpdate(booking._id, bookingData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Telefon raqamini formatlash
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        phoneNumber: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>

        <div className={`inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                {t('Bronni tahrirlash', language)}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Customer Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <User className="h-4 w-4 inline mr-1" />
                {t('Mijoz ismi', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder={t('Mijoz ismini kiriting', language)}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Phone className="h-4 w-4 inline mr-1" />
                {t('Telefon raqam', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="+998 90 123 45 67"
                required
              />
            </div>

            {/* License Plate */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Car className="h-4 w-4 inline mr-1" />
                {t('Davlat raqami', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors uppercase ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="01 A 123 BC"
                required
              />
            </div>

            {/* Booking Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('Bron sanasi', language)}
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500 focus:border-red-500 [color-scheme:dark]'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('Tug\'ilgan kun', language)}
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500 focus:border-red-500 [color-scheme:dark]'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors font-medium ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {isSubmitting ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
