import React, { useState } from 'react';
import { X, User, UserPlus, Phone, Percent, DollarSign, Calendar } from 'lucide-react';
import { useCreateApprentice } from '@/hooks/useUsers';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatPhoneNumber, validatePhoneNumber, getPhoneDigits } from '@/lib/phoneUtils';
import { useTheme } from '@/contexts/ThemeContext';

interface CreateApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (apprenticeData: any) => Promise<any>;
}

const CreateApprenticeModal: React.FC<CreateApprenticeModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    percentage: 50,
    profession: '',
    experience: 0,
    profileImage: '',
    paymentType: 'percentage' as 'percentage' | 'daily',
    dailyRate: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createApprenticeMutation = useCreateApprentice();
  
  useBodyScrollLock(isOpen);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = 'Ism kamida 2 ta belgidan iborat bolishi kerak';
    }

    if (formData.username.length < 3) {
      newErrors.username = 'Username kamida 3 ta belgidan iborat bolishi kerak';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username faqat harflar, raqamlar va _ belgisidan iborat bolishi mumkin';
    }

    if (!formData.phone || !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Telefon raqam toliq va togri formatda kiritilishi kerak';
    }

    // Kunlik ishchi uchun kunlik ish haqi majburiy
    if (formData.paymentType === 'daily' && (!formData.dailyRate || formData.dailyRate < 1000)) {
      newErrors.dailyRate = 'Kunlik ish haqi kamida 1000 so\'m bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const apprenticeData = {
        ...formData,
        phone: getPhoneDigits(formData.phone),
        profileImage: '',
        password: getPhoneDigits(formData.phone),
        role: 'apprentice'
      };

      console.log('📤 Sending apprentice data:', {
        name: apprenticeData.name,
        username: apprenticeData.username,
        paymentType: apprenticeData.paymentType,
        percentage: apprenticeData.percentage,
        dailyRate: apprenticeData.dailyRate
      });

      if (onCreate) {
        await onCreate(apprenticeData);
      } else {
        await createApprenticeMutation.mutateAsync(apprenticeData);
      }
      
      setFormData({
        name: '',
        username: '',
        phone: '',
        percentage: 50,
        profession: '',
        experience: 0,
        profileImage: '',
        paymentType: 'percentage',
        dailyRate: 0
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating apprentice:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        phone: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 animate-fadeIn">
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden mx-2 sm:mx-0 transform transition-all animate-slideUp ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`relative overflow-hidden rounded-t-xl sm:rounded-t-2xl px-4 sm:px-6 py-3 sm:py-4 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-orange-600 to-orange-500'
        }`}>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white bg-opacity-20 backdrop-blur-sm mr-2.5">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-white">Yangi shogird</h2>
                <p className={`text-xs hidden sm:block ${
                  isDarkMode ? 'text-red-100' : 'text-orange-100'
                }`}>
                  Shogird malumotlarini kiriting
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
          {/* Toliq ism */}
          <div>
            <label htmlFor="name" className={`block text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Toliq ism *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500' 
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                }`}
                placeholder="Alisher Navoiy"
              />
            </div>
            {errors.name && <p className="mt-0.5 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className={`block text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Foydalanuvchi nomi *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>@</span>
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500' 
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                }`}
                placeholder="username"
              />
            </div>
            {errors.username && <p className="mt-0.5 text-xs text-red-600">{errors.username}</p>}
          </div>

          {/* Telefon */}
          <div>
            <label htmlFor="phone" className={`block text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Telefon raqam *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.phone 
                    ? 'border-red-300 focus:border-red-500' 
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                }`}
                placeholder="+998 90 123 45 67"
              />
            </div>
            {errors.phone && <p className="mt-0.5 text-xs text-red-600">{errors.phone}</p>}
          </div>

          {/* To'lov turi tanlash */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              To'lov turi *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'percentage' }))}
                className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                  formData.paymentType === 'percentage'
                    ? isDarkMode
                      ? 'border-red-500 bg-red-900/30 text-red-400'
                      : 'border-orange-500 bg-orange-50 text-orange-700'
                    : isDarkMode
                      ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Percent className="h-4 w-4 mx-auto mb-0.5" />
                Foizli ishchi
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'daily' }))}
                className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                  formData.paymentType === 'daily'
                    ? isDarkMode
                      ? 'border-green-500 bg-green-900/30 text-green-400'
                      : 'border-green-500 bg-green-50 text-green-700'
                    : isDarkMode
                      ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 mx-auto mb-0.5" />
                Kunlik ishchi
              </button>
            </div>
          </div>

          {/* Foizli ishchi uchun */}
          {formData.paymentType === 'percentage' && (
            <div>
              <label htmlFor="percentage" className={`block text-xs font-semibold mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Foiz (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="number"
                  id="percentage"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={`w-full pl-9 pr-10 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder-gray-400'
                  }`}
                  placeholder="50"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
                </div>
              </div>
            </div>
          )}

          {/* Kunlik ishchi uchun */}
          {formData.paymentType === 'daily' && (
            <div>
              <label htmlFor="dailyRate" className={`block text-xs font-semibold mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Kunlik ish haqi (so'm) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="number"
                  id="dailyRate"
                  name="dailyRate"
                  value={formData.dailyRate || ''}
                  onChange={handleChange}
                  onFocus={(e) => {
                    e.target.value = '';
                    setFormData(prev => ({ ...prev, dailyRate: 0 }));
                  }}
                  min="1000"
                  step="1000"
                  required
                  className={`w-full pl-9 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                    errors.dailyRate 
                      ? 'border-red-300 focus:border-red-500' 
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500 placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 focus:border-green-500 placeholder-gray-400'
                  }`}
                  placeholder="100000"
                />
              </div>
              {errors.dailyRate && <p className="mt-0.5 text-xs text-red-600">{errors.dailyRate}</p>}
              <p className="mt-0.5 text-xs text-green-600 font-medium">
                ✓ Har kuni avtomatik to'lov qo'shiladi
              </p>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createApprenticeMutation.isPending}
              className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900'
                  : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
              }`}
            >
              {createApprenticeMutation.isPending ? 'Yuklanmoqda...' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApprenticeModal;
