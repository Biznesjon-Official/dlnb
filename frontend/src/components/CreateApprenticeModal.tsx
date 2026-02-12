import React, { useState } from 'react';
import { X, User, UserPlus, Phone, Percent } from 'lucide-react';
import { useCreateApprentice } from '@/hooks/useUsers';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatPhoneNumber, validatePhoneNumber, getPhoneDigits } from '@/lib/phoneUtils';

interface CreateApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (apprenticeData: any) => Promise<any>;
}

const CreateApprenticeModal: React.FC<CreateApprenticeModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    percentage: 50,
    profession: '',
    experience: 0,
    profileImage: ''
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
        profileImage: ''
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
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0 transform transition-all animate-slideUp">
        <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-6">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white bg-opacity-20 backdrop-blur-sm mr-3">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Yangi shogird</h2>
                <p className="text-blue-100 text-xs sm:text-sm">Shogird malumotlarini kiriting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 sm:p-2 transition-all duration-200"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Toliq ism *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-4 py-2 sm:py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="Alisher Navoiy"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Foydalanuvchi nomi *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium text-sm">@</span>
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-4 py-2 sm:py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.username ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="username"
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Telefon raqam *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={`w-full pl-9 pr-4 py-2 sm:py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm ${
                  errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="+998 90 123 45 67"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="percentage" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Foiz (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                id="percentage"
                name="percentage"
                value={formData.percentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full pl-9 pr-10 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="50"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createApprenticeMutation.isPending}
              className="flex-1 px-4 py-2 sm:py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
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
