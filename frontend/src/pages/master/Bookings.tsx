import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Phone, Car, Plus, Edit2, Trash2, Clock, Gift, Cake, PartyPopper, Sparkles } from 'lucide-react';
import { t } from '@/lib/transliteration';
import BookingsSkeleton from '@/components/BookingsSkeleton';
import CreateBookingModal from '../../components/CreateBookingModal';
import EditBookingModal from '../../components/EditBookingModal';
import DeleteBookingModal from '../../components/DeleteBookingModal';
import BirthdaySmsModal from '../../components/BirthdaySmsModal';
import { useBookingsNew } from '@/hooks/useBookingsNew';
import { useTheme } from '@/contexts/ThemeContext';

interface Booking {
  _id: string;
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  bookingDate: string;
  birthDate?: string; // Tug'ilgan kun
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Bookings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBirthdaySmsModalOpen, setIsBirthdaySmsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ⚡ ULTRA FAST: Yangi optimallashtirilgan hook
  const { bookings: bookingsData, loading: isLoading, createBooking, deleteBooking, updateBooking } = useBookingsNew();

  const bookings = useMemo(() => bookingsData || [], [bookingsData]);

  // Tug'ilgan kungacha qolgan kunlarni hisoblash
  const getDaysUntilBirthday = (birthDate?: string) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    
    // Bugungi yilga tug'ilgan kunni o'tkazish
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    // Agar bu yilgi tug'ilgan kun o'tib ketgan bo'lsa, keyingi yilga o'tkazish
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Kunlar farqini hisoblash
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Mijozlarni qidirish - memoized
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    
    const query = searchQuery.toLowerCase();
    return bookings.filter((booking: Booking) =>
      booking.customerName.toLowerCase().includes(query) ||
      booking.phoneNumber.toLowerCase().includes(query) ||
      booking.licensePlate.toLowerCase().includes(query)
    );
  }, [bookings, searchQuery]);

  // Bronlarni tug'ilgan kun bo'yicha saralash - memoized
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const daysA = getDaysUntilBirthday(a.birthDate);
      const daysB = getDaysUntilBirthday(b.birthDate);

      // Tug'ilgan kuni 0-2 kun oralig'ida bo'lganlarni eng yuqoriga
      if (daysA !== null && daysA >= 0 && daysA <= 2) {
        if (daysB !== null && daysB >= 0 && daysB <= 2) {
          return daysA - daysB;
        }
        return -1;
      }
      if (daysB !== null && daysB >= 0 && daysB <= 2) {
        return 1;
      }

      return 0;
    });
  }, [filteredBookings]);

  const handleSendBirthdaySms = useCallback((booking: Booking) => {
    if (!booking.phoneNumber) {
      return;
    }
    
    setSelectedBooking(booking);
    setIsBirthdaySmsModalOpen(true);
  }, []);

  const handleEdit = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Search */}
        <div className={`rounded-2xl shadow-xl p-6 ${
          isDarkMode
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
            : 'bg-gradient-to-r from-orange-500 to-amber-600'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{t('Mijozlar bronlari', language)}</h1>
              <p className="text-white/80 mt-1">{t('Mijozlar bronlarini boshqaring', language)}</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Mijoz, telefon yoki raqam...', language)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 shadow-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30 text-white placeholder:text-gray-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                />
                <svg
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              {/* Add Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-lg hover:shadow-xl whitespace-nowrap ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                }`}
              >
                <Plus className="h-5 w-5" />
                {t('Yangi bron', language)}
              </button>
            </div>
          </div>
        </div>

      {/* Bookings List - Compact Card View */}
      {isLoading ? (
        <BookingsSkeleton />
      ) : sortedBookings.length === 0 ? (
        <div className={`rounded-xl shadow-sm border p-8 text-center ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-200'
        }`}>
          <Calendar className={`h-16 w-16 mx-auto mb-3 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <p className={`text-base font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {searchQuery ? t('Qidiruv natijasi topilmadi', language) : t('Bronlar topilmadi', language)}
          </p>
          {searchQuery && (
            <p className={`text-sm mt-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              "{searchQuery}" bo'yicha natija yo'q
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBookings.map((booking: Booking) => {
            const daysUntilBirthday = getDaysUntilBirthday(booking.birthDate);
            const isBirthdaySoon = daysUntilBirthday !== null && daysUntilBirthday >= 0 && daysUntilBirthday <= 2;

            return (
              <div
                key={booking._id}
                className={`group relative rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col ${
                  isBirthdaySoon 
                    ? isDarkMode
                      ? 'border-red-600 bg-gradient-to-br from-red-900/40 via-gray-800 to-gray-900'
                      : 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white'
                    : isDarkMode
                      ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
                      : 'bg-white border-gray-200 hover:border-orange-300'
                }`}
              >
                {/* Birthday Badge */}
                {isBirthdaySoon && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="relative group/badge">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-lg animate-pulse opacity-75 ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900'
                          : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500'
                      }`}></div>
                      
                      {/* Badge */}
                      <div className={`relative text-white rounded-full p-2.5 shadow-2xl transform group-hover/badge:scale-110 transition-all duration-300 ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                          : 'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500'
                      }`}>
                        {daysUntilBirthday === 0 ? (
                          <PartyPopper className="h-5 w-5 animate-bounce" />
                        ) : daysUntilBirthday === 1 ? (
                          <Cake className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Sparkles className="h-5 w-5" />
                        )}
                      </div>
                      
                      {/* Tooltip */}
                      <div className={`absolute top-full right-0 mt-2 px-3 py-1.5 text-white text-xs rounded-lg opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-200 whitespace-nowrap shadow-xl ${
                        isDarkMode ? 'bg-gray-900' : 'bg-gray-900'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {daysUntilBirthday === 0 ? (
                            <>
                              <PartyPopper className="h-3.5 w-3.5" />
                              <span>Bugun tug'ilgan kun!</span>
                            </>
                          ) : (
                            <>
                              <Cake className="h-3.5 w-3.5" />
                              <span>{daysUntilBirthday} kun qoldi</span>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-full right-4 border-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4 flex flex-col h-full">
                  {/* Content wrapper - flex-1 to take available space */}
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-base font-bold truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {booking.customerName}
                          </h3>
                          {isBirthdaySoon && (
                            <div className="flex items-center gap-1">
                              {daysUntilBirthday === 0 ? (
                                <PartyPopper className="h-5 w-5 text-pink-500 animate-bounce" />
                              ) : (
                                <Cake className="h-5 w-5 text-orange-500 animate-pulse" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Phone className="h-3 w-3" />
                          <span className="font-medium truncate">{booking.phoneNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-2 mt-3">{/* License Plate */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-blue-900/40 border-blue-800'
                        : 'bg-blue-50 border-blue-100'
                    }`}>
                      <Car className={`h-4 w-4 flex-shrink-0 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <span className={`text-xs font-bold truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{booking.licensePlate}</span>
                    </div>

                    {/* Booking Date */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                      booking.bookingDate 
                        ? isDarkMode
                          ? 'bg-purple-900/40 border-purple-800'
                          : 'bg-purple-50 border-purple-100'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <Calendar className={`h-4 w-4 flex-shrink-0 ${
                        booking.bookingDate 
                          ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          : 'text-gray-400'
                      }`} />
                      <span className={`text-xs font-medium truncate ${
                        booking.bookingDate 
                          ? isDarkMode ? 'text-white' : 'text-gray-900'
                          : 'text-gray-400'
                      }`}>
                        {booking.bookingDate ? formatDate(booking.bookingDate) : 'XX/XX/XXXX'}
                      </span>
                    </div>

                    {/* Birth Date */}
                    <div className={`relative flex items-center gap-2 p-2 rounded-lg border overflow-hidden ${
                      booking.birthDate
                        ? isBirthdaySoon 
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-red-900/60 via-red-800/60 to-gray-800/60 border-red-700'
                            : 'bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 border-yellow-300'
                          : isDarkMode
                            ? 'bg-green-900/40 border-green-800'
                            : 'bg-green-50 border-green-100'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      {/* Animated background for birthday soon */}
                      {booking.birthDate && isBirthdaySoon && (
                        <div className={`absolute inset-0 animate-pulse ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-red-800/50 via-red-700/50 to-gray-800/50'
                            : 'bg-gradient-to-r from-yellow-200/50 via-orange-200/50 to-pink-200/50'
                        }`}></div>
                      )}
                      
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg shadow-md ${
                        booking.birthDate
                          ? isBirthdaySoon 
                            ? isDarkMode
                              ? 'bg-gradient-to-br from-red-600 to-red-700'
                              : 'bg-gradient-to-br from-orange-400 to-pink-500'
                            : isDarkMode
                              ? 'bg-green-600'
                              : 'bg-green-500'
                          : isDarkMode
                            ? 'bg-gray-700'
                            : 'bg-gray-400'
                      }`}>
                        {booking.birthDate ? (
                          isBirthdaySoon ? (
                            daysUntilBirthday === 0 ? (
                              <PartyPopper className="h-4 w-4 text-white animate-bounce" />
                            ) : (
                              <Cake className="h-4 w-4 text-white" />
                            )
                          ) : (
                            <Gift className="h-4 w-4 text-white" />
                          )
                        ) : (
                          <Gift className="h-4 w-4 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 relative z-10">
                        <span className={`text-xs font-medium truncate block ${
                          booking.birthDate 
                            ? isDarkMode ? 'text-white' : 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {booking.birthDate ? formatDate(booking.birthDate) : 'XX/XX/XXXX'}
                        </span>
                        {booking.birthDate && isBirthdaySoon && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {daysUntilBirthday === 0 ? (
                              <>
                                <Sparkles className={`h-3 w-3 ${
                                  isDarkMode ? 'text-red-400' : 'text-pink-600'
                                }`} />
                                <span className={`text-xs font-bold ${
                                  isDarkMode ? 'text-red-400' : 'text-pink-600'
                                }`}>Bugun!</span>
                              </>
                            ) : (
                              <>
                                <Clock className={`h-3 w-3 ${
                                  isDarkMode ? 'text-red-400' : 'text-orange-600'
                                }`} />
                                <span className={`text-xs font-bold ${
                                  isDarkMode ? 'text-red-400' : 'text-orange-600'
                                }`}>{daysUntilBirthday} kun qoldi</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Actions - Always at bottom */}
                  <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${
                    isDarkMode ? 'border-red-900/30' : 'border-gray-100'
                  }`}>{isBirthdaySoon && (
                      <button
                        onClick={() => handleSendBirthdaySms(booking)}
                        className="flex-1 relative overflow-hidden flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all group"
                      >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <Gift className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="relative z-10">SMS</span>
                        
                        {/* Sparkle effect */}
                        <Sparkles className="h-3 w-3 relative z-10 animate-pulse" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(booking)}
                      className={`${isBirthdaySoon ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg text-xs font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {!isBirthdaySoon && t('Tahrirlash', language)}
                    </button>
                    <button
                      onClick={() => handleDelete(booking)}
                      className={`${isBirthdaySoon ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg text-xs font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {!isBirthdaySoon && t('O\'chirish', language)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateBookingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={createBooking}
        />
      )}

      {isEditModalOpen && selectedBooking && (
        <EditBookingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onUpdate={updateBooking}
        />
      )}

      {isDeleteModalOpen && selectedBooking && (
        <DeleteBookingModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onDelete={deleteBooking}
        />
      )}

      {isBirthdaySmsModalOpen && selectedBooking && (
        <BirthdaySmsModal
          isOpen={isBirthdaySmsModalOpen}
          onClose={() => {
            setIsBirthdaySmsModalOpen(false);
            setSelectedBooking(null);
          }}
          customerName={selectedBooking.customerName}
          phoneNumber={selectedBooking.phoneNumber}
        />
      )}
      </div>
    </div>
  );
};

export default Bookings;
