import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

interface Booking {
  _id: string;
  customerName: string;
  licensePlate: string;
}

interface DeleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onDelete: (id: string) => Promise<any>;
}

const DeleteBookingModal: React.FC<DeleteBookingModalProps> = ({ isOpen, onClose, booking, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // ⚡ INSTANT: Modal darhol yopiladi
      onClose();
      
      // Background'da o'chirish
      await onDelete(booking._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>

        <div className={`inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
            : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
              : 'bg-gradient-to-r from-red-600 to-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                {t('Bronni o\'chirish', language)}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="mb-6">
              <p className={`mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('Haqiqatan ham ushbu bronni o\'chirmoqchimisiz?', language)}
              </p>
              <div className={`rounded-lg p-4 space-y-2 ${
                isDarkMode
                  ? 'bg-gray-800 border border-red-900/30'
                  : 'bg-gray-50'
              }`}>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('Mijoz:', language)}</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('Mashina:', language)}</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{booking.licensePlate}</span>
                </div>
              </div>
              <p className="text-red-500 text-sm mt-4">
                {t('Bu amalni ortga qaytarib bo\'lmaydi!', language)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
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
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                {isDeleting ? t('O\'chirilmoqda...', language) : t('O\'chirish', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookingModal;
