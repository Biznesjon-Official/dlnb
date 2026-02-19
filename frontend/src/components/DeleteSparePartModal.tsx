import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeleteSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart | null;
  onSuccess: () => void;
  deleteSparePart: (id: string) => Promise<void>; // YANGI: Function prop
}

const DeleteSparePartModal: React.FC<DeleteSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onSuccess,
  deleteSparePart // YANGI: Function prop
}) => {
  const { isDarkMode } = useTheme();
  const language = (localStorage.getItem('language') as 'latin' | 'cyrillic') || 'latin';
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !sparePart) return null;

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double click
    
    setIsDeleting(true);
    
    try {
      // YANGI: To'g'ridan-to'g'ri deleteSparePart funksiyasini chaqirish
      await deleteSparePart(sparePart._id);
      
      // Success callback
      onSuccess();
      
      // Modal'ni yopish
      onClose();
    } catch (error: any) {
      console.error('❌ Error deleting spare part:', error);
      // Xatolik toast hook ichida ko'rsatiladi
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-80 backdrop-blur-sm" onClick={onClose} />

        <div className={`inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl border ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-red-900/30' 
            : 'bg-white border-rose-200'
        }`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-red-900/30' : 'border-rose-200'
          }`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('Zapchastni o\'chirish', language)}</h3>
            <button onClick={onClose} className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`} disabled={isDeleting}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 rounded-full border ${
                isDarkMode 
                  ? 'bg-red-900/30 border-red-700/50' 
                  : 'bg-rose-100 border-rose-300'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-rose-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('Ushbu zapchastni o\'chirmoqchimisiz?', language)}
                </p>
                <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sparePart.name}</p>
                {sparePart.supplier && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sparePart.supplier}</p>}
              </div>
            </div>

            <div className={`rounded-lg p-3 border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/50' 
                : 'bg-rose-50 border-rose-200'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-rose-700'}`}>
                {t('Bu amalni ortga qaytarib bo\'lmaydi!', language)}
              </p>
            </div>
          </div>

          <div className={`flex justify-end space-x-3 px-6 py-4 border-t ${
            isDarkMode ? 'border-red-900/30 bg-gray-800/50' : 'border-rose-200 bg-gray-50'
          }`}>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-800 border-red-900/30 hover:bg-gray-700' 
                  : 'text-gray-700 bg-white border-rose-200 hover:bg-gray-50'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-4 py-2 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-red-900/30' 
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'
              }`}
            >
              {isDeleting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {t('O\'chirish', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteSparePartModal;
