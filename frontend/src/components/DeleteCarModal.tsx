import React, { useState } from 'react';
import { X, AlertTriangle, Car as CarIcon } from 'lucide-react';
import { Car } from '@/types';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

const DeleteCarModal: React.FC<DeleteCarModalProps> = ({ isOpen, onClose, car }) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const { deleteCar } = useCarsNew();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  const handleDelete = async () => {
    if (!car) return;
    
    try {
      setIsLoading(true);
      await deleteCar(car._id);
      onClose();
      
      // Faqat online rejimda sahifani yangilash
      if (navigator.onLine) {
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch (error) {
      console.error('Error deleting car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !car) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between rounded-t-xl ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-orange-600 to-orange-500'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t("Arxivga o'tkazish", language)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className={`rounded-full p-3 ${
                isDarkMode ? 'bg-red-900/30' : 'bg-orange-100'
              }`}>
                <CarIcon className={`h-6 w-6 ${
                  isDarkMode ? 'text-red-400' : 'text-orange-600'
                }`} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {car.make} {car.carModel} ({car.year})
              </h3>
              <p className={`text-sm mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className="font-medium">{t('Davlat raqami:', language)}</span> {car.licensePlate}
              </p>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className="font-medium">{t('Egasi:', language)}</span> {car.ownerName}
              </p>
            </div>
          </div>

          <div className={`border rounded-lg p-4 mb-6 ${
            isDarkMode
              ? 'bg-blue-900/20 border-blue-800'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <p className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  {t("Mashina arxivga o'tkaziladi", language)}
                </p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-800'
                }`}>
                  {t("Mashina arxivda saqlanadi va kerak bo'lganda ko'rishingiz mumkin. Barcha ma'lumotlar saqlanib qoladi.", language)}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-4 mb-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t("Mashinani arxivga o'tkazmoqchimisiz?", language)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-end space-x-3 rounded-b-xl ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 ${
              isDarkMode
                ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-900'
                : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
            }`}
          >
            {isLoading ? t("Arxivga o'tkazilmoqda...", language) : t("Ha, arxivga o'tkazish", language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCarModal;
