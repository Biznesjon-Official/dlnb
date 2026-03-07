import { useState } from 'react';
import {
  X, Phone, Calendar, Car as CarIcon, CreditCard, TrendingUp,
  TrendingDown, Wrench, Package, CheckCircle,
  ChevronDown, ChevronUp, Banknote, History
} from 'lucide-react';
import { useCustomerDetails } from '../hooks/useCustomers';

interface CustomerModalProps {
  customerId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    completed: 'Tugallangan', 'in-progress': 'Jarayonda',
    pending: 'Kutilmoqda', delivered: 'Topshirilgan',
    paid: "To'langan", partial: 'Qisman', unpaid: "To'lanmagan",
  };
  return map[status] || status;
};

const statusColor = (status: string, isDark: boolean) => {
  const map: Record<string, string> = {
    completed: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
    delivered: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
    'in-progress': isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
    pending: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    paid: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
    partial: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    unpaid: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
  };
  return map[status] || (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700');
};

const methodLabel = (method: string) => {
  const map: Record<string, string> = { cash: 'Naqd', card: 'Karta', click: 'Click' };
  return map[method] || method;
};

const fmt = (n: number) => n.toLocaleString('uz-UZ') + " so'm";
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CustomerModal = ({ customerId, isDarkMode: isDark, onClose }: CustomerModalProps) => {
  const { data, isLoading } = useCustomerDetails(customerId);
  const [expandedCar, setExpandedCar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cars' | 'debts' | 'payments'>('cars');

  const customer = data?.customer;
  const cars = (data?.cars || []) as any[];
  const debts = data?.debts || [];

  // Barcha to'lovlar tarixi (barcha mashinalardan)
  const allPayments = cars.flatMap((car: any) =>
    (car.payments || []).map((p: any) => ({
      ...p,
      carInfo: `${car.make} ${car.carModel} (${car.licensePlate})`,
    }))
  ).sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  // Umumiy statistika
  const totalEstimate = cars.reduce((s: number, c: any) => s + (c.totalEstimate || 0), 0);
  const totalPaid = customer?.totalPaid || 0;
  const totalDebt = customer?.totalDebt || 0;

  const card = (className: string, children: React.ReactNode) => (
    <div className={`p-3 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${className}`}>
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-5 py-4 rounded-t-2xl ${
          isDark
            ? 'bg-gradient-to-r from-red-700 via-red-800 to-gray-900'
            : 'bg-gradient-to-r from-rose-500 to-pink-600'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {isLoading ? '?' : customer?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-5 w-36 bg-white/20 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-white truncate">{customer?.name}</h2>
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{customer?.phone}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Umumiy statistika */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {card(
                isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wrench className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Jami xizmat</span>
                  </div>
                  <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(totalEstimate)}</p>
                </>
              )}
              {card(
                isDark ? 'bg-green-500/10' : 'bg-green-50',
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>To'langan</span>
                  </div>
                  <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(totalPaid)}</p>
                </>
              )}
              {card(
                totalDebt > 0 ? (isDark ? 'bg-red-500/10' : 'bg-red-50') : (isDark ? 'bg-gray-800' : 'bg-gray-100'),
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className={`w-4 h-4 ${totalDebt > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`} />
                    <span className={`text-xs font-medium ${totalDebt > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Qarz</span>
                  </div>
                  <p className={`text-base font-bold ${totalDebt > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                    {fmt(totalDebt)}
                  </p>
                </>
              )}
              {card(
                isDark ? 'bg-purple-500/10' : 'bg-purple-50',
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Oxirgi tashrif</span>
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {customer ? fmtDate(customer.lastVisit) : '—'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{cars.length} ta mashina</p>
                </>
              )}
            </div>
          )}

          {/* Tablar */}
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            {([
              { key: 'cars', label: `Mashinalar (${cars.length})`, icon: CarIcon },
              { key: 'debts', label: `Qarzlar (${debts.length})`, icon: CreditCard },
              { key: 'payments', label: `To'lovlar (${allPayments.length})`, icon: History },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === key
                    ? isDark ? 'bg-red-600 text-white' : 'bg-white text-rose-600 shadow'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Tab: Mashinalar */}
          {activeTab === 'cars' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className={`h-24 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ) : cars.length === 0 ? (
                <div className={`text-center py-8 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <CarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mashinalar yo'q</p>
                </div>
              ) : cars.map((car: any) => {
                const isExpanded = expandedCar === car._id;
                const services = car.serviceItems || [];
                const payments = car.payments || [];
                const parts = car.parts || [];

                return (
                  <div key={car._id} className={`rounded-xl border overflow-hidden ${
                    isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
                  }`}>
                    {/* Mashina header */}
                    <button
                      onClick={() => setExpandedCar(isExpanded ? null : car._id)}
                      className="w-full text-left"
                    >
                      <div className={`px-4 py-3 flex items-center justify-between gap-3 ${
                        isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                      } transition-colors`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}>
                            <CarIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {car.make} {car.carModel}
                              {car.year ? ` (${car.year})` : ''}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {car.licensePlate}
                              </span>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {fmtDate(car.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {car.isDeleted && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-600/40 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                              Arxiv
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(car.status, isDark)}`}>
                            {statusLabel(car.status)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                        </div>
                      </div>

                      {/* Narx satri */}
                      <div className={`px-4 pb-3 flex items-center gap-4 text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>Jami: <strong className={isDark ? 'text-white' : 'text-gray-800'}>{fmt(car.totalEstimate || 0)}</strong></span>
                        <span>To'langan: <strong className={isDark ? 'text-green-400' : 'text-green-600'}>{fmt(car.paidAmount || 0)}</strong></span>
                        {(car.totalEstimate - car.paidAmount) > 0 && (
                          <span>Qarz: <strong className={isDark ? 'text-red-400' : 'text-red-600'}>{fmt(car.totalEstimate - car.paidAmount)}</strong></span>
                        )}
                        <span className={`ml-auto px-2 py-0.5 rounded-full ${statusColor(car.paymentStatus || 'pending', isDark)}`}>
                          {statusLabel(car.paymentStatus || 'pending')}
                        </span>
                      </div>
                    </button>

                    {/* Kengaytirilgan: xizmatlar va to'lovlar */}
                    {isExpanded && (
                      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} divide-y ${
                        isDark ? 'divide-gray-700' : 'divide-gray-100'
                      }`}>
                        {/* Xizmatlar */}
                        {services.length > 0 && (
                          <div className="px-4 py-3 space-y-2">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Wrench className="w-3.5 h-3.5 inline mr-1" />
                              Xizmatlar ({services.length})
                            </p>
                            {services.map((s: any, i: number) => (
                              <div key={i} className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{s.name}</p>
                                  {s.description && (
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.description}</p>
                                  )}
                                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {s.category === 'part' ? 'Zapchast' : s.category === 'material' ? 'Material' : 'Mehnat'} × {s.quantity}
                                  </span>
                                </div>
                                <p className={`text-sm font-semibold flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {fmt(s.price * s.quantity)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Zapchastlar */}
                        {parts.length > 0 && (
                          <div className="px-4 py-3 space-y-2">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Package className="w-3.5 h-3.5 inline mr-1" />
                              Zapchastlar ({parts.length})
                            </p>
                            {parts.map((p: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    p.status === 'installed'
                                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                      : isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                                  }`}>
                                    {p.status === 'installed' ? 'O\'rnatilgan' : p.status === 'ordered' ? 'Buyurtma' : p.status === 'available' ? 'Mavjud' : 'Kerak'}
                                  </span>
                                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{p.name} × {p.quantity}</p>
                                </div>
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {fmt(p.price * p.quantity)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* To'lovlar tarixi (ushbu mashina) */}
                        {payments.length > 0 && (
                          <div className="px-4 py-3 space-y-2">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Banknote className="w-3.5 h-3.5 inline mr-1" />
                              To'lovlar ({payments.length})
                            </p>
                            {payments.map((p: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                                  <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {fmtDateTime(p.paidAt)}
                                    </p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                      {methodLabel(p.method)}
                                    </span>
                                  </div>
                                </div>
                                <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                  +{fmt(p.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {services.length === 0 && parts.length === 0 && payments.length === 0 && (
                          <div className={`px-4 py-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Ma'lumot yo'q
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Qarzlar */}
          {activeTab === 'debts' && (
            <div className="space-y-2">
              {isLoading ? (
                <div className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ) : debts.length === 0 ? (
                <div className={`text-center py-8 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Qarzlar yo'q</p>
                </div>
              ) : debts.map((debt: any) => (
                <div key={debt._id} className={`p-3 rounded-xl border ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {debt.description || 'Qarz'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Jami: {fmt(debt.amount)}
                        </span>
                        {debt.paidAmount > 0 && (
                          <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            To'langan: {fmt(debt.paidAmount)}
                          </span>
                        )}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {fmtDate(debt.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(debt.status, isDark)}`}>
                        {statusLabel(debt.status)}
                      </span>
                      <span className={`text-sm font-bold ${
                        debt.status === 'paid' ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {fmt(debt.amount - (debt.paidAmount || 0))} qoldi
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Barcha to'lovlar tarixi */}
          {activeTab === 'payments' && (
            <div className="space-y-2">
              {isLoading ? (
                <div className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ) : allPayments.length === 0 ? (
                <div className={`text-center py-8 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>To'lovlar tarixi yo'q</p>
                </div>
              ) : allPayments.map((p: any, i: number) => (
                <div key={i} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-green-500/20' : 'bg-green-100'
                    }`}>
                      <Banknote className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {p.carInfo}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {fmtDateTime(p.paidAt)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {methodLabel(p.method)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-base font-bold flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    +{fmt(p.amount)}
                  </p>
                </div>
              ))}

              {/* Jami */}
              {allPayments.length > 0 && (
                <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                  isDark ? 'border-green-600/50 bg-green-500/10' : 'border-green-300 bg-green-50'
                }`}>
                  <span className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    Jami to'langan
                  </span>
                  <span className={`text-base font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    {fmt(allPayments.reduce((s: number, p: any) => s + p.amount, 0))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
