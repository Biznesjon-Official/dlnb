import React from 'react';
import { X, Package, DollarSign, TrendingUp, Calendar, Edit, Trash2 } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface SparePart {
  _id: string;
  name: string;
  price?: number; // Optional - backward compatibility
  costPrice?: number; // O'zini narxi
  sellingPrice?: number; // Sotish narxi
  currency?: 'UZS' | 'USD'; // Valyuta turi
  profit?: number; // Foyda (virtual field)
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ViewSparePartModal: React.FC<ViewSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onEdit, 
  onDelete 
}) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden mx-2 border border-red-900/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-gray-900 px-4 py-3">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{sparePart.name}</h2>
              <span className="text-xs text-red-100">{sparePart.supplier}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-140px)] scrollbar-hide">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-3 border border-red-900/30">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400">{t('Miqdor', language)}</span>
              </div>
              <p className="text-lg font-bold text-white">
                {sparePart.quantity} {t('dona', language)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-3 border border-red-900/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400">{t('Ishlatilgan', language)}</span>
              </div>
              <p className="text-lg font-bold text-white">
                {sparePart.usageCount} {t('marta', language)}
              </p>
            </div>
          </div>

          {/* Narxlar Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-400">{t("O'zini", language)}</span>
              </div>
              <p className="text-sm font-bold text-white">
                {sparePart.currency === 'USD' ? '$' : ''}{(sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-semibold text-green-400">{t('Sotish', language)}</span>
              </div>
              <p className="text-sm font-bold text-white">
                {sparePart.currency === 'USD' ? '$' : ''}{(sparePart.sellingPrice || sparePart.price || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">{t('Foyda', language)}</span>
              </div>
              <p className="text-sm font-bold text-white">
                {sparePart.currency === 'USD' ? '$' : ''}{(sparePart.profit || ((sparePart.sellingPrice || sparePart.price || 0) - (sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0))).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-400">{t('Jami qiymat', language)}</span>
              <span className="text-sm font-bold text-white">
                {sparePart.currency === 'USD' ? '$' : ''}{((sparePart.sellingPrice || sparePart.price || 0) * sparePart.quantity).toLocaleString()} {sparePart.currency === 'UZS' ? t("so'm", language) : ''}
              </span>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">{t('Jami foyda', language)}</span>
              <span className="text-sm font-bold text-emerald-300">
                {sparePart.currency === 'USD' ? '$' : ''}{((sparePart.profit || ((sparePart.sellingPrice || sparePart.price || 0) - (sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0))) * sparePart.quantity).toLocaleString()} {sparePart.currency === 'UZS' ? t("so'm", language) : ''}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-red-400" />
                <span className="text-xs font-semibold text-red-400">{t('Yaratilgan', language)}</span>
              </div>
              <p className="text-[10px] text-gray-300">{formatDate(sparePart.createdAt)}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-semibold text-orange-400">{t('Yangilangan', language)}</span>
              </div>
              <p className="text-[10px] text-gray-300">{formatDate(sparePart.updatedAt)}</p>
            </div>
          </div>

          {/* Balon ma'lumotlari */}
          {/* @ts-ignore */}
          {sparePart.category === 'balon' && (
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg p-3 border-2 border-red-900/30">
              <h3 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('Balon ma\'lumotlari', language)}
              </h3>
              <div className="space-y-2">
                {/* @ts-ignore */}
                {sparePart.tireSize && (
                  <div className="flex items-center justify-between bg-gray-800/60 rounded-lg p-2 border border-red-900/20">
                    <span className="text-xs text-gray-400">{t('O\'lchami', language)}:</span>
                    {/* @ts-ignore */}
                    <span className="text-sm font-bold text-white">{sparePart.tireSize}</span>
                  </div>
                )}
                {/* @ts-ignore */}
                {sparePart.tireBrand && (
                  <div className="flex items-center justify-between bg-gray-800/60 rounded-lg p-2 border border-red-900/20">
                    <span className="text-xs text-gray-400">{t('Brend', language)}:</span>
                    {/* @ts-ignore */}
                    <span className="text-sm font-bold text-white">{sparePart.tireBrand}</span>
                  </div>
                )}
                {/* @ts-ignore */}
                {sparePart.tireType && (
                  <div className="flex items-center justify-between bg-gray-800/60 rounded-lg p-2 border border-red-900/20">
                    <span className="text-xs text-gray-400">{t('Turi', language)}:</span>
                    <span className="text-sm font-bold text-white">
                      {/* @ts-ignore */}
                      {sparePart.tireType === 'yozgi' ? t('Yozgi', language) : 
                       /* @ts-ignore */
                       sparePart.tireType === 'qishki' ? t('Qishki', language) : 
                       t('Universal', language)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 border border-red-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">{t('Holat', language)}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                sparePart.isActive 
                  ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                  : 'bg-red-900/30 text-red-400 border border-red-700/50'
              }`}>
                {sparePart.isActive ? t('Faol', language) : t('Nofaol', language)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 pt-2 border-t border-red-900/30">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800 border border-red-900/30 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('Yopish', language)}
            </button>
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-2 text-xs font-medium text-red-400 bg-gray-800 border border-red-900/30 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                {t('Tahrirlash', language)}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-xs font-medium text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg hover:bg-red-900/30 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                {t("O'chirish", language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSparePartModal;