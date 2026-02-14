import React, { useState, useEffect } from 'react';
import { X, Gift, MessageSquare, Sparkles, Send } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';

interface BirthdaySmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phoneNumber: string;
}

const BirthdaySmsModal: React.FC<BirthdaySmsModalProps> = ({
  isOpen,
  onClose,
  customerName,
  phoneNumber
}) => {
  const { isDarkMode } = useTheme();
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Modal ochilganda orqa scroll'ni bloklash
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // SMS shablonlari
  const templates = [
    `Tabriklaymiz, ${customerName}! Tug'ilgan kuningiz bilan! Avtojon Service`,
    `Hurmatli ${customerName}! Sizni tug'ilgan kuningiz bilan chin dildan tabriklaymiz! Sog'lik va baxt tilaymiz! Avtojon Service`,
    `${customerName}, tug'ilgan kuningiz muborak! Omad va muvaffaqiyatlar tilaymiz! Avtojon Service`,
    `Aziz ${customerName}! Tug'ilgan kuningiz bilan! Har doim sog' bo'ling! Avtojon Service`
  ];

  const handleSendSms = () => {
    // Telefon raqamini tozalash (faqat raqamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // SMS ilovasini ochish
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(templates[selectedTemplate])}`;
    window.open(smsUrl, '_blank');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>

      <div className={`relative rounded-xl shadow-2xl w-full max-w-xl ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800'
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 px-5 py-3.5 relative overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          <div className="flex items-center justify-between relative">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Gift className="h-6 w-6 animate-bounce" />
              {t('SMS yuborish', language)}
              <Sparkles className="h-5 w-5 animate-pulse" />
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          {/* Mijoz ma'lumotlari */}
          <div className={`rounded-lg p-4 border shadow-sm ${
            isDarkMode
              ? 'bg-gradient-to-br from-pink-900/30 via-purple-900/30 to-blue-900/30 border-pink-800'
              : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Gift className="h-5 w-5 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('Mijoz', language)}</p>
                <p className={`text-base font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customerName}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Shablon tanlash */}
          <div>
            <label className={`block text-sm font-medium mb-2.5 flex items-center gap-1.5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <MessageSquare className="h-4 w-4" />
              {t('Shablon tanlang', language)}
            </label>
            <div className="space-y-2.5">
              {templates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedTemplate(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedTemplate === index
                      ? isDarkMode
                        ? 'border-pink-600 bg-gradient-to-r from-pink-900/40 to-purple-900/40 shadow-md scale-[1.02]'
                        : 'border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md scale-[1.02]'
                      : isDarkMode
                        ? 'border-gray-700 bg-gray-800 hover:border-pink-700 hover:shadow-sm'
                        : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedTemplate === index
                        ? 'border-pink-500 bg-pink-500 shadow-sm'
                        : isDarkMode
                          ? 'border-gray-600'
                          : 'border-gray-300'
                    }`}>
                      {selectedTemplate === index && (
                        <Send className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed flex-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{template}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 border rounded-lg transition-colors text-sm font-medium ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="button"
              onClick={handleSendSms}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all text-sm font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              {t('Yuborish', language)}
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthdaySmsModal;
