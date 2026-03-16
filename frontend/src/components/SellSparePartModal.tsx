import React, { useState } from 'react';
import { X, DollarSign, Package, User, Phone } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

interface SellSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPart?: any) => void; // Yangilangan tovarni qaytarish
  sparePart: any;
  sellSparePart: (id: string, quantity: number, sellingPrice?: number) => Promise<void>; // YANGI: Function prop
}

const SellSparePartModal: React.FC<SellSparePartModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sparePart,
  sellSparePart // YANGI: Function prop
}) => {
  const { isDarkMode } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(sparePart?.sellingPrice || 0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const language = (localStorage.getItem('language') as 'latin' | 'cyrillic') || 'latin';

  if (!isOpen || !sparePart) return null;

  const totalRevenue = sellingPrice * quantity;
  const totalCost = sparePart.costPrice * quantity;
  const profit = totalRevenue - totalCost;
  const isUSD = sparePart.currency === 'USD';
  const formatPrice = (val: number) => isUSD
    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : formatCurrency(val);

  // Telefon raqamini formatlash
  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const numbers = value.replace(/\D/g, '');
    
    // 998 bilan boshlanmasa, qo'shish
    let formatted = numbers;
    if (!formatted.startsWith('998') && formatted.length > 0) {
      formatted = '998' + formatted;
    }
    
    // Maksimal 12 raqam (998 + 9 raqam)
    formatted = formatted.slice(0, 12);
    
    return formatted;
  };

  // Telefon raqamini ko'rsatish formati
  const displayPhoneNumber = (value: string) => {
    if (!value) return '';
    
    // +998 XX XXX XX XX formatiga o'tkazish
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return `+${numbers}`;
    if (numbers.length <= 5) return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`;
    if (numbers.length <= 10) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8)}`;
    return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 10)} ${numbers.slice(10, 12)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity > sparePart.quantity) {
      toast.error(t(`Omborda yetarli miqdor yo'q. Mavjud: ${sparePart.quantity} dona`, language));
      return;
    }

    if (sellingPrice <= 0) {
      toast.error(t('Sotish narxi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    setIsSubmitting(true);

    try {
      // Sotish operatsiyasini bajarish
      await sellSparePart(sparePart._id, quantity, sellingPrice);
      
      // Muvaffaqiyatli bo'lsa, modal'ni yopish va callback'ni chaqirish
      onSuccess(quantity);
      onClose();
    } catch (error: any) {
      console.error('Error selling spare part:', error);
      // Xatolik toast hook ichida ko'rsatiladi
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto scrollbar-hide border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-red-900/30' 
          : 'bg-white border-rose-200'
      }`}>
        <div className={`sticky top-0 px-3 py-2.5 rounded-t-xl ${
          isDarkMode 
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900' 
            : 'bg-gradient-to-r from-rose-500 to-pink-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {t('Zapchast sotish', language)}
                </h2>
                <p className={`text-[10px] mt-0.5 truncate max-w-[200px] ${
                  isDarkMode ? 'text-red-100' : 'text-rose-100'
                }`}>{sparePart.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-2.5 space-y-2">
          <div className={`rounded-lg p-2.5 border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
              : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Package className={`h-3.5 w-3.5 ${isDarkMode ? 'text-red-400' : 'text-rose-600'}`} />
              <h3 className={`text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-rose-600'}`}>{t('Tovar ma\'lumotlari', language)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className={`text-[10px] mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Mavjud miqdor', language)}</p>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sparePart.quantity} dona</p>
              </div>
              <div>
                <p className={`text-[10px] mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Tannarx', language)}</p>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatPrice(sparePart.costPrice)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('Sotish miqdori', language)} *
            </label>
            <input
              type="number"
              min="1"
              max={sparePart.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(sparePart.quantity, parseInt(e.target.value) || 1)))}
              className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 border-red-900/30 focus:border-red-500 text-white' 
                  : 'bg-white border-rose-200 focus:border-rose-500 text-gray-900'
              }`}
              required
            />
            <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('Maksimal', language)}: {sparePart.quantity} dona
            </p>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('Sotish narxi (dona)', language)} *
            </label>
            <input
              type="number"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 border-red-900/30 focus:border-red-500 text-white' 
                  : 'bg-white border-rose-200 focus:border-rose-500 text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <User className="h-3 w-3" />
              {t('Xaridor ismi', language)}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 border-red-900/30 focus:border-red-500 text-white' 
                  : 'bg-white border-rose-200 focus:border-rose-500 text-gray-900'
              }`}
              placeholder={t('Ixtiyoriy', language)}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <Phone className="h-3 w-3" />
              {t('Xaridor telefoni', language)}
            </label>
            <input
              type="text"
              value={displayPhoneNumber(customerPhone)}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setCustomerPhone(formatted);
              }}
              className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 border-red-900/30 focus:border-red-500 text-white' 
                  : 'bg-white border-rose-200 focus:border-rose-500 text-gray-900'
              }`}
              placeholder="+998 XX XXX XX XX"
            />
            {customerPhone && customerPhone.length === 12 && (
              <p className="text-[10px] text-green-400 mt-0.5 flex items-center gap-1">
                <Phone className="h-2.5 w-2.5" />
                {displayPhoneNumber(customerPhone)}
              </p>
            )}
            {customerPhone && customerPhone.length > 0 && customerPhone.length < 12 && (
              <p className="text-[10px] text-orange-400 mt-0.5">
                {t('12 raqam kiriting', language)} ({customerPhone.length}/12)
              </p>
            )}
          </div>

          <div className={`rounded-lg p-2.5 border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
              : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200'
          }`}>
            <h3 className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-rose-600'}`}>{t('Hisob-kitob', language)}</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Jami tannarx', language)}:</span>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatPrice(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Jami tushum', language)}:</span>
                <span className="text-xs font-bold text-green-400">{formatPrice(totalRevenue)}</span>
              </div>
              <div className={`h-px ${isDarkMode ? 'bg-red-900/30' : 'bg-rose-200'}`}></div>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('Foyda', language)}:</span>
                <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPrice(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className={`flex gap-2 pt-2 border-t ${isDarkMode ? 'border-red-900/30' : 'border-rose-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-1.5 text-xs border rounded-lg font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 border-red-900/30 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 border-rose-200 hover:bg-gray-50'
              }`}
              disabled={isSubmitting}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-3 py-1.5 text-xs text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-800 shadow-red-900/30' 
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'
              }`}
            >
              {isSubmitting ? t('Saqlanmoqda...', language) : t('Sotish', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellSparePartModal;
