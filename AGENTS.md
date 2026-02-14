# DALNOBOY SHOP - AI AGENT GUIDE
# Avtomobil Ta'mirlash Boshqaruv Tizimi - To'liq Yo'riqnoma

---

## � LOYIHA HAQIDA UMUMIY MA'LUMOT

**Loyiha nomi**: Dalnoboy Shop  
**Versiya**: 2.0.0  
**Turi**: Full-stack PWA (Progressive Web App)  
**Maqsad**: Avtomobil ta'mirlash ustaxonasini boshqarish tizimi

### Asosiy Funksiyalar
1. **Avtomobillar boshqaruvi** - Mashinalar CRUD, arxivlash, restore
2. **Moliyaviy boshqaruv** - Qarzlar, to'lovlar, tranzaksiyalar, kassa
3. **Shogirdlar tizimi** - Vazifalar, yutuqlar, daromad hisoblash
4. **Ombor boshqaruvi** - Zapchastlar, sotish, inventarizatsiya
5. **AI yordamchi** - Groq AI chat widget
6. **Telegram integratsiya** - Avtomatik xabarlar
7. **PWA** - Mobil qurilmalarda o'rnatish
8. **Offline-First** - Internet yo'qligida ham ishlaydi

---

## 🏗️ TEXNOLOGIYALAR VA ARXITEKTURA

### Frontend Stack
- **Framework**: React 18.2 + TypeScript 5.2
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.3
- **State Management**: @tanstack/react-query 5.90
- **Routing**: react-router-dom 6.20
- **Local Storage**: IndexedDB (idb 8.0, dexie 4.3)
- **Icons**: lucide-react 0.294
- **Forms**: react-hook-form 7.48
- **Notifications**: react-hot-toast 2.6
- **HTTP Client**: axios 1.6
- **PWA**: vite-plugin-pwa 1.2

### Backend Stack
- **Runtime**: Node.js + Express 4.18
- **Language**: TypeScript 5.3
- **Database**: MongoDB 8.0 (Mongoose)
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Security**: helmet 7.1, express-rate-limit 7.1
- **File Upload**: multer 2.0
- **AI**: groq-sdk 0.37
- **Telegram**: node-telegram-bot-api 0.67
- **Cron Jobs**: node-cron 4.2
- **Password**: bcryptjs 2.4
- **Compression**: compression 1.8

### Arxitektura Pattern'lari
1. **Repository Pattern** - Ma'lumotlar bilan ishlash
2. **Offline-First** - IndexedDB + Background Sync
3. **Optimistic UI** - Instant updates
4. **Queue Management** - Pending operations
5. **Network-First Strategy** - Online bo'lganda server'dan
6. **MVC Pattern** - Backend strukturasi

---

## 📁 LOYIHA STRUKTURASI


### Root Directory
```
fura/
├── backend/              # Backend (Node.js + Express + MongoDB)
├── frontend/             # Frontend (React + TypeScript + Vite)
├── .kiro/               # Kiro IDE konfiguratsiyasi
├── docker-compose.yml   # Docker konfiguratsiya
├── deploy.sh            # Deploy skripti
├── manage.sh            # Boshqaruv skripti
└── *.md                 # Dokumentatsiya fayllari
```

### Backend Strukturasi
```
backend/
├── src/
│   ├── controllers/     # API endpoint'lar logikasi
│   │   ├── carController.ts          # Mashinalar CRUD
│   │   ├── authController.ts         # Autentifikatsiya
│   │   ├── taskController.ts         # Vazifalar
│   │   ├── debtController.ts         # Qarzlar
│   │   ├── transactionController.ts  # Tranzaksiyalar
│   │   ├── sparePartController.ts    # Zapchastlar
│   │   ├── statsController.ts        # Statistika
│   │   └── ...
│   ├── models/          # MongoDB Mongoose modellari
│   │   ├── Car.ts       # Mashina modeli
│   │   ├── User.ts      # Foydalanuvchi modeli
│   │   ├── Task.ts      # Vazifa modeli
│   │   ├── Debt.ts      # Qarz modeli
│   │   ├── Transaction.ts  # Tranzaksiya modeli
│   │   ├── SparePart.ts    # Zapchast modeli
│   │   └── ...
│   ├── routes/          # Express route'lar
│   │   ├── cars.ts
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   └── ...
│   ├── middleware/      # Express middleware'lar
│   │   ├── auth.ts      # JWT autentifikatsiya
│   │   ├── rateLimiter.ts  # Rate limiting
│   │   ├── security.ts     # Xavfsizlik
│   │   └── ...
│   ├── services/        # Business logika
│   │   ├── debtService.ts
│   │   ├── telegramService.ts
│   │   ├── monthlyResetService.ts
│   │   └── ...
│   ├── scripts/         # Utility skriptlar
│   │   ├── seedCars.ts
│   │   ├── deleteAllCars.ts
│   │   ├── resetDatabase.ts
│   │   └── ...
│   ├── config/          # Konfiguratsiya
│   │   └── database.ts
│   └── index.ts         # Entry point
├── uploads/             # Yuklangan fayllar
├── .env                 # Environment variables
└── package.json
```

### Frontend Strukturasi
```
frontend/
├── src/
│   ├── components/      # React komponentlar (60+ fayl)
│   │   ├── CreateCarModal.tsx
│   │   ├── EditCarModal.tsx
│   │   ├── DeleteCarModal.tsx
│   │   ├── CarPaymentModalHybrid.tsx
│   │   ├── IncomeModal.tsx
│   │   ├── ExpenseModal.tsx
│   │   ├── AIChatWidget.tsx
│   │   └── ...
│   ├── pages/           # Sahifalar
│   │   ├── Cars.tsx     # Mashinalar sahifasi
│   │   ├── Debts.tsx    # Qarzlar sahifasi
│   │   ├── master/      # Master foydalanuvchi sahifalari
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Apprentices.tsx
│   │   │   ├── Warehouse.tsx
│   │   │   └── Cashier.tsx
│   │   └── apprentice/  # Shogird sahifalari
│   │       ├── Dashboard.tsx
│   │       ├── Tasks.tsx
│   │       └── Achievements.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useCarsNew.ts        # Mashinalar hook (Offline-First)
│   │   ├── useDebts.ts          # Qarzlar hook
│   │   ├── useTransactions.ts   # Tranzaksiyalar hook
│   │   ├── useTasks.ts          # Vazifalar hook
│   │   ├── useSpareParts.ts     # Zapchastlar hook
│   │   └── ...
│   ├── lib/             # Utility kutubxonalar
│   │   ├── repositories/  # Repository Pattern
│   │   │   ├── BaseRepository.ts
│   │   │   ├── CarsRepository.ts
│   │   │   └── ...
│   │   ├── sync/          # Sync tizimi
│   │   │   ├── SyncManager.ts
│   │   │   ├── QueueManager.ts
│   │   │   └── NetworkManager.ts
│   │   ├── storage/       # Storage
│   │   │   └── IndexedDBManager.ts
│   │   ├── types/         # TypeScript types
│   │   │   └── base.ts
│   │   ├── utils/         # Utility funksiyalar
│   │   │   └── errors.ts
│   │   ├── api.ts         # Axios konfiguratsiya
│   │   └── transliteration.ts
│   ├── types/           # Global types
│   │   └── index.ts
│   ├── App.tsx          # Root komponent
│   └── main.tsx         # Entry point
├── public/              # Static fayllar
│   ├── sw.js           # Service Worker
│   ├── manifest.json   # PWA manifest
│   └── dlnb.png        # Logo
├── .env                # Environment variables
└── package.json
```

---

## 🎯 ASOSIY MODULLAR VA ULARNING VAZIFALARI


### Root Directory
```
fura/
├── backend/              # Backend server (Node.js + Express + MongoDB)
├── frontend/             # Frontend app (React + TypeScript + Vite)
├── node_modules/         # Root dependencies
├── .git/                 # Git repository
├── .kiro/                # Kiro IDE settings
├── .vscode/              # VS Code settings
├── docker-compose.yml    # Docker development setup
├── docker-compose.production.yml  # Docker production setup
├── package.json          # Root package (concurrently scripts)
├── AGENTS.md            # Bu fayl - AI agent yo'riqnomasi
├── ARCHITECTURE.md      # Arxitektura dokumentatsiyasi
├── README.md            # Loyiha haqida umumiy ma'lumot
└── *.md                 # Boshqa dokumentatsiya fayllari
```

### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # API endpoint handlers
│   │   ├── authController.ts        # Login, register
│   │   ├── carController.ts         # Mashinalar CRUD
│   │   ├── taskController.ts        # Vazifalar
│   │   ├── debtController.ts        # Qarzlar
│   │   ├── transactionController.ts # Tranzaksiyalar
│   │   ├── sparePartController.ts   # Zapchastlar
│   │   ├── statsController.ts       # Statistika
│   │   └── ...
│   ├── models/          # MongoDB Mongoose models
│   │   ├── User.ts      # Foydalanuvchilar (Master/Apprentice)
│   │   ├── Car.ts       # Mashinalar
│   │   ├── Task.ts      # Vazifalar
│   │   ├── Debt.ts      # Qarzlar
│   │   ├── Transaction.ts  # Tranzaksiyalar
│   │   ├── SparePart.ts    # Zapchastlar
│   │   ├── SparePartSale.ts  # Zapchast sotish
│   │   ├── MonthlyHistory.ts # Oylik tarix
│   │   └── ...
│   ├── routes/          # Express routes
│   │   ├── auth.ts
│   │   ├── cars.ts
│   │   ├── tasks.ts
│   │   ├── debts.ts
│   │   └── ...
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── validation.ts  # Request validation
│   │   ├── rateLimiter.ts # Rate limiting
│   │   └── ...
│   ├── services/        # Business logic
│   │   ├── debtService.ts  # Qarzlar logikasi
│   │   ├── monthlyResetService.ts  # Oylik reset
│   │   ├── telegramService.ts  # Telegram bot
│   │   └── ...
│   ├── scripts/         # Utility scripts
│   │   ├── seedCars.ts  # Test ma'lumotlar
│   │   ├── deleteAllCars.ts  # Barcha mashinalarni o'chirish
│   │   ├── resetDatabase.ts  # Database reset
│   │   └── ...
│   ├── config/          # Configuration
│   │   └── database.ts  # MongoDB connection
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (build output)
├── uploads/             # Uploaded files
│   ├── profiles/        # Profile pictures
│   └── services/        # Service images
├── package.json         # Backend dependencies
├── tsconfig.json        # TypeScript config
├── Dockerfile           # Docker image
└── .env                 # Environment variables
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/      # React components (60+ files)
│   │   ├── CreateCarModal.tsx
│   │   ├── EditCarModal.tsx
│   │   ├── DeleteCarModal.tsx
│   │   ├── CarPaymentModalHybrid.tsx
│   │   ├── IncomeModal.tsx
│   │   ├── ExpenseModal.tsx
│   │   ├── CreateTaskModal.tsx
│   │   ├── AIChatWidget.tsx
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Cars.tsx     # Mashinalar sahifasi
│   │   ├── Debts.tsx    # Qarzlar sahifasi
│   │   ├── Login.tsx    # Login sahifasi
│   │   ├── master/      # Master foydalanuvchi sahifalari
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Apprentices.tsx
│   │   │   ├── Warehouse.tsx
│   │   │   └── Cashier.tsx
│   │   └── apprentice/  # Shogird sahifalari
│   │       ├── Dashboard.tsx
│   │       ├── Tasks.tsx
│   │       ├── Achievements.tsx
│   │       └── AIDiagnostic.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useCarsNew.ts      # Mashinalar hook (YANGI!)
│   │   ├── useDebts.ts        # Qarzlar hook
│   │   ├── useDebtsNew.ts     # Qarzlar hook (YANGI!)
│   │   ├── useTasks.ts        # Vazifalar hook
│   │   ├── useTransactions.ts # Tranzaksiyalar hook
│   │   ├── useSpareParts.ts   # Zapchastlar hook
│   │   └── ...
│   ├── lib/             # Core libraries
│   │   ├── repositories/  # Repository pattern
│   │   │   ├── BaseRepository.ts     # Base CRUD
│   │   │   ├── CarsRepository.ts     # Cars-specific
│   │   │   └── ...
│   │   ├── sync/          # Offline sync system
│   │   │   ├── NetworkManager.ts     # Network detection
│   │   │   ├── SyncManager.ts        # Sync operations
│   │   │   └── QueueManager.ts       # Queue management
│   │   ├── storage/       # Local storage
│   │   │   └── IndexedDBManager.ts   # IndexedDB wrapper
│   │   ├── types/         # TypeScript types
│   │   │   └── base.ts
│   │   ├── utils/         # Utility functions
│   │   │   └── errors.ts
│   │   ├── api.ts         # Axios instance
│   │   └── transliteration.ts  # Lotin/Kirill
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static files
│   ├── sw.js            # Service Worker
│   ├── manifest.json    # PWA manifest
│   └── dlnb.png         # Logo
├── dist/                # Build output
├── package.json         # Frontend dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
├── Dockerfile           # Docker image
└── .env                 # Environment variables
```

---

## 🎯 ASOSIY MODULLAR VA ULARNING VAZIFALARI

### 1. 🚗 CARS (Mashinalar) Module

**Backend Files:**
- `backend/src/controllers/carController.ts` - CRUD operations
- `backend/src/models/Car.ts` - MongoDB schema
- `backend/src/routes/cars.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useCarsNew.ts` - Main hook (YANGI!)
- `frontend/src/lib/repositories/CarsRepository.ts` - Repository
- `frontend/src/pages/Cars.tsx` - Main page
- `frontend/src/components/CreateCarModal.tsx`
- `frontend/src/components/EditCarStepModal.tsx`
- `frontend/src/components/DeleteCarModal.tsx`
- `frontend/src/components/RestoreCarModal.tsx`
- `frontend/src/components/CompleteCarModal.tsx`
- `frontend/src/components/CarPaymentModalHybrid.tsx`

**Asosiy Funksiyalar:**
- ✅ Create car (offline support)
- ✅ Update car (optimistic UI)
- ✅ Delete car (soft delete)
- ✅ Restore car (from archive)
- ✅ Complete car (mark as done)
- ✅ Add payment
- ✅ Add parts (keltirish kerak bo'lgan qismlar)
- ✅ Add service items (xizmatlar)
- ✅ Archive/Active tabs
- ✅ Search and filter

**Muhim Qoidalar:**
- Har doim `useCarsNew` hook ishlatish (eski `useCarsHybrid` emas!)
- Soft delete ishlatish (`isDeleted: true`)
- Arxivlangan mashinalar to'liq ma'lumotlar bilan qaytarilishi kerak
- Optimistic UI updates
- Offline support (IndexedDB)



### 2. 💰 DEBTS (Qarzlar) Module

**Backend Files:**
- `backend/src/controllers/debtController.ts` - CRUD operations
- `backend/src/models/Debt.ts` - MongoDB schema
- `backend/src/services/debtService.ts` - Business logic
- `backend/src/routes/debts.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useDebts.ts` - Main hook
- `frontend/src/hooks/useDebtsNew.ts` - Optimized hook (YANGI!)
- `frontend/src/pages/Debts.tsx` - Main page
- `frontend/src/components/IncomeModal.tsx` - To'lov qo'shish

**Asosiy Funksiyalar:**
- ✅ Create debt (qarz yaratish)
- ✅ Add payment (to'lov qo'shish)
- ✅ View debt history (tarix ko'rish)
- ✅ Filter by type (receivable/payable)
- ✅ Search debts
- ✅ Automatic debt creation (mashina to'lanmagan bo'lsa)

**Muhim Qoidalar:**
- Qarz avtomatik yaratiladi (mashina to'lanmagan bo'lsa)
- To'lov qo'shilganda qarz avtomatik yangilanadi
- Har bir to'lov transaction yaratadi
- Qarz to'liq to'langanda status "paid" bo'ladi

---

### 3. 💳 TRANSACTIONS (Tranzaksiyalar) Module

**Backend Files:**
- `backend/src/controllers/transactionController.ts` - CRUD operations
- `backend/src/models/Transaction.ts` - MongoDB schema
- `backend/src/routes/transactions.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useTransactions.ts` - Main hook
- `frontend/src/pages/master/Cashier.tsx` - Kassa sahifasi
- `frontend/src/components/IncomeModal.tsx` - Kirim qo'shish
- `frontend/src/components/ExpenseModal.tsx` - Chiqim qo'shish
- `frontend/src/components/SalaryExpenseModal.tsx` - Oylik qo'shish

**Asosiy Funksiyalar:**
- ✅ Create income (kirim yaratish)
- ✅ Create expense (chiqim yaratish)
- ✅ View transactions (tranzaksiyalarni ko'rish)
- ✅ Filter by type/category/date
- ✅ Statistics (statistika)
- ✅ Monthly reset (oylik reset)

**Transaction Types:**
- `income` - Kirim (mashina to'lovi, qarz to'lovi)
- `expense` - Chiqim (zapchast, oylik, boshqa)
- `salary` - Oylik (shogirdlar oyligi)

**Muhim Qoidalar:**
- Har bir to'lov transaction yaratadi
- Transaction o'chirib bo'lmaydi (faqat ko'rish)
- Oylik reset barcha ma'lumotlarni arxivlaydi
- Balans hisob-kitobi to'g'ri bo'lishi kerak

---

### 4. 👨‍🔧 TASKS (Vazifalar) Module

**Backend Files:**
- `backend/src/controllers/taskController.ts` - CRUD operations
- `backend/src/models/Task.ts` - MongoDB schema
- `backend/src/routes/tasks.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useTasks.ts` - Main hook
- `frontend/src/pages/apprentice/Tasks.tsx` - Vazifalar sahifasi
- `frontend/src/components/CreateTaskModal.tsx` - Vazifa yaratish
- `frontend/src/components/EditTaskModal.tsx` - Vazifa tahrirlash

**Asosiy Funksiyalar:**
- ✅ Create task (vazifa yaratish)
- ✅ Assign to apprentice (shogirdga tayinlash)
- ✅ Update status (statusni yangilash)
- ✅ Complete task (vazifani tugatish)
- ✅ Calculate earnings (daromad hisoblash)
- ✅ View task history (tarix ko'rish)

**Task Status:**
- `pending` - Kutilmoqda
- `in-progress` - Jarayonda
- `completed` - Tugallangan
- `approved` - Tasdiqlangan

**Muhim Qoidalar:**
- Vazifa tugaganda shogird daromadi avtomatik hisoblanadi
- Foiz hisob-kitobi to'g'ri bo'lishi kerak
- Master vazifani tasdiqlashi kerak
- Oylik reset barcha vazifalarni arxivlaydi

---

### 5. 📦 SPARE PARTS (Zapchastlar) Module

**Backend Files:**
- `backend/src/controllers/sparePartController.ts` - CRUD operations
- `backend/src/models/SparePart.ts` - MongoDB schema
- `backend/src/models/SparePartSale.ts` - Sotish tarixi
- `backend/src/routes/spareParts.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useSpareParts.ts` - Main hook
- `frontend/src/pages/master/Warehouse.tsx` - Ombor sahifasi
- `frontend/src/components/CreateSparePartModal.tsx` - Zapchast qo'shish
- `frontend/src/components/EditSparePartModal.tsx` - Zapchast tahrirlash
- `frontend/src/components/SellSparePartModal.tsx` - Zapchast sotish
- `frontend/src/components/DeleteSparePartModal.tsx` - Zapchast o'chirish

**Asosiy Funksiyalar:**
- ✅ Create spare part (zapchast qo'shish)
- ✅ Update spare part (zapchast yangilash)
- ✅ Sell spare part (zapchast sotish)
- ✅ Delete spare part (zapchast o'chirish)
- ✅ View sales history (sotish tarixi)
- ✅ Low stock alert (kam qolgan zapchastlar)
- ✅ Statistics (statistika)

**Muhim Qoidalar:**
- Zapchast sotilganda quantity kamayadi
- Manfiy qiymatlar bo'lmasligi kerak
- Har bir sotish SparePartSale yaratadi
- Zapchast 0 ga yetganda ogohlantirish

---

### 6. 👥 USERS (Foydalanuvchilar) Module

**Backend Files:**
- `backend/src/controllers/authController.ts` - Auth operations
- `backend/src/models/User.ts` - MongoDB schema
- `backend/src/routes/auth.ts` - API routes

**Frontend Files:**
- `frontend/src/hooks/useUsers.ts` - Main hook
- `frontend/src/pages/master/Apprentices.tsx` - Shogirdlar sahifasi
- `frontend/src/components/CreateApprenticeModal.tsx` - Shogird yaratish

**User Roles:**
- `master` - Ustaxona egasi (barcha huquqlar)
- `apprentice` - Shogird (cheklangan huquqlar)

**Asosiy Funksiyalar:**
- ✅ Login/Logout
- ✅ Create apprentice (shogird yaratish)
- ✅ Update apprentice (shogird yangilash)
- ✅ View earnings (daromadni ko'rish)
- ✅ View achievements (yutuqlarni ko'rish)
- ✅ Monthly reset (oylik reset)

**Muhim Qoidalar:**
- Master barcha sahifalarga kirishi mumkin
- Shogird faqat o'z sahifalariga kirishi mumkin
- JWT token bilan autentifikatsiya
- Token 30 kun amal qiladi

---

## 🔄 OFFLINE-FIRST ARXITEKTURA

### Asosiy Komponentlar

#### 1. NetworkManager (`frontend/src/lib/sync/NetworkManager.ts`)
**Vazifasi**: Network holatini kuzatish

**Funksiyalar:**
- `isOnline()` - Online yoki offline ekanligini tekshirish
- `getStatus()` - Network statusini olish
- `onStatusChange()` - Status o'zgarganda callback
- `checkBackendHealth()` - Backend ishlayotganini tekshirish

**Ishlash prinsipi:**
- 5 soniyada bir marta backend'ni tekshiradi
- `navigator.onLine` va backend health check
- Event-based notification system

#### 2. SyncManager (`frontend/src/lib/sync/SyncManager.ts`)
**Vazifasi**: Pending operatsiyalarni sync qilish

**Funksiyalar:**
- `startAutoSync()` - Avtomatik sync'ni boshlash
- `stopAutoSync()` - Avtomatik sync'ni to'xtatish
- `forceSyncNow()` - Darhol sync qilish
- `onSyncComplete()` - Sync tugaganda callback

**Ishlash prinsipi:**
- Online bo'lganda avtomatik sync boshlanadi
- Background'da sezilmasin ishlaydi
- Retry logic (3 marta urinadi)
- Error handling

#### 3. QueueManager (`frontend/src/lib/sync/QueueManager.ts`)
**Vazifasi**: Pending operatsiyalarni boshqarish

**Funksiyalar:**
- `addOperation()` - Operatsiya qo'shish
- `getPendingOperations()` - Pending operatsiyalarni olish
- `removeOperation()` - Operatsiyani o'chirish
- `getPendingCount()` - Pending operatsiyalar sonini olish

**Ishlash prinsipi:**
- FIFO queue (First In First Out)
- IndexedDB'da saqlanadi
- Operation prioritization

#### 4. IndexedDBManager (`frontend/src/lib/storage/IndexedDBManager.ts`)
**Vazifasi**: Ma'lumotlarni mahalliy saqlash

**Funksiyalar:**
- `save()` - Ma'lumotlarni saqlash
- `getAll()` - Barcha ma'lumotlarni olish
- `getById()` - ID bo'yicha olish
- `update()` - Yangilash
- `delete()` - O'chirish

**Ishlash prinsipi:**
- IndexedDB API wrapper
- Batch operations (10x tezroq)
- Error handling

#### 5. Repository Pattern (`frontend/src/lib/repositories/`)
**Vazifasi**: CRUD operatsiyalarni boshqarish

**BaseRepository:**
- `getAll()` - Barcha ma'lumotlarni olish
- `create()` - Yaratish
- `update()` - Yangilash
- `delete()` - O'chirish

**CarsRepository (extends BaseRepository):**
- Cars-specific metodlar
- Validation
- Transform for server

**Ishlash prinsipi:**
- Network-First Strategy
- Offline fallback
- Optimistic updates
- Automatic queue management

---

## 📊 PERFORMANCE OPTIMIZATIONS

### 1. Batch Operations
```typescript
// OLDIN: Har bir operatsiya alohida (sekin)
for (const item of items) {
  await db.put(item); // 100ms * 10 = 1000ms
}

// HOZIR: Batch operations (10x tezroq)
await Promise.all(items.map(item => db.put(item))); // 100ms
```

### 2. Set-Based Filtering
```typescript
// OLDIN: O(n²) - sekin
items.filter(item => !deleteIds.includes(item.id))

// HOZIR: O(1) - tez
const deleteSet = new Set(deleteIds);
items.filter(item => !deleteSet.has(item.id))
```

### 3. Optimistic UI Updates
```typescript
// 1. UI'ni darhol yangilash (0ms)
setCars(prev => [...prev, newCar]);

// 2. Background'da saqlash (sezilmasin)
carsRepository.create(carData).then(...);
```

### 4. Fire-and-Forget Pattern
```typescript
// UI darhol yangilanadi
updateCar(id, data); // Returns immediately

// Background'da saqlanadi
// User hech narsani sezmaydi
```

### Performance Natijalari
- **Delete**: 2.0s → 0.06s (33x tezroq)
- **Create**: 2.8s → 0.09s (31x tezroq)
- **Update**: 2.4s → 0.07s (34x tezroq)
- **Load**: 2.7s → 1.35s (2x tezroq)

---

## 🎨 KOD YOZISH QOIDALARI

### Dizayn va Ranglar
**Asosiy Rang Sxemasi**: Qizil va Qora (Red & Black Theme)

**Dark Mode (Qorong'i rejim):**
- **Asosiy fon**: `from-gray-900 via-gray-800 to-gray-900` (gradient)
- **Kartalar**: `from-gray-800 via-gray-900 to-gray-800` (gradient)
- **Aktsent ranglar**: Qizil gradientlar (`from-red-600 via-red-700 to-gray-900`)
- **Matn**: Oq va och kulrang (`text-white`, `text-gray-200`, `text-gray-400`)
- **Chegaralar**: Qizil va kulrang (`border-red-900/30`, `border-gray-700`)
- **Hover effektlar**: Qizil va qora gradientlar
- **Aktiv holatlar**: Qizil gradient bilan (`bg-gradient-to-r from-red-600 via-red-700 to-gray-900`)

**Light Mode (Yorug' rejim):**
- **Asosiy fon**: Oq va och kulrang (`bg-white`, `from-slate-50 via-blue-50 to-indigo-50`)
- **Kartalar**: Oq (`bg-white`)
- **Aktsent ranglar**: Ko'k va indigo gradientlar (`from-blue-500 to-indigo-600`)
- **Matn**: Qora va to'q kulrang (`text-gray-900`, `text-gray-700`)
- **Chegaralar**: Och kulrang (`border-gray-200`, `border-gray-100`)
- **Hover effektlar**: Ko'k va indigo gradientlar
- **Aktiv holatlar**: Ko'k gradient bilan (`bg-gradient-to-r from-blue-500 to-indigo-600`)

**Logo va Branding:**
- Logo fayli: `public/dlnb.png`
- Logo ranglari: Qizil va qora gradient
- Logo shakli: Aylana (circular) border bilan
- Sidebar'da logo: Gradient background bilan

**Rang Ishlatish Qoidalari:**
- Har doim dark/light mode uchun conditional styling ishlatish
- Qizil rangni asosiy aktsent rang sifatida ishlatish (dark mode)
- Ko'k rangni asosiy aktsent rang sifatida ishlatish (light mode)
- Gradient'larni professional ko'rinish uchun ishlatish
- Hover va active holatlar uchun ranglarni to'g'ri tanlash
- Accessibility uchun yetarli contrast ta'minlash

**Tailwind CSS Classes:**
```typescript
// Dark mode example
className={`${
  isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-red-900/30' 
    : 'bg-white text-gray-900 border-gray-200'
}`}

// Gradient buttons (dark mode)
className="bg-gradient-to-r from-red-600 via-red-700 to-gray-900"

// Gradient buttons (light mode)
className="bg-gradient-to-r from-blue-500 to-indigo-600"
```

### TypeScript
- Har doim type'lar bilan ishlash
- `any` ishlatmaslik
- Interface'lar yaratish
- Generics ishlatish

### React
- Functional components ishlatish
- Custom hooks yaratish
- Memoization (useMemo, useCallback)
- Proper cleanup (useEffect return)

### Naming Conventions
- **Components**: PascalCase (`CreateCarModal.tsx`)
- **Hooks**: camelCase with `use` prefix (`useCarsNew.ts`)
- **Functions**: camelCase (`createCar`, `updateCar`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`Car`, `User`, `BaseEntity`)

### Comment'lar
- Uzbek tilida yozish
- Muhim qismlarni tushuntirish
- TODO/FIXME ishlatish

### Error Handling
- Try-catch ishlatish
- Toast notifications
- Rollback on error
- Logging

---

## 🚀 DEPLOYMENT

### Development
```bash
npm run dev  # Frontend va backend birga ishga tushadi
```

### Production (Docker)
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Production (PM2)
```bash
cd backend
npm run build
npm run pm2:start
```

### Environment Variables
**Backend (.env):**
- `PORT` - Server port (4000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key (min 64 chars)
- `GROQ_API_KEY` - Groq AI API key
- `TELEGRAM_BOT_TOKEN_CAR` - Telegram bot token
- `TELEGRAM_BOT_TOKEN_DEBT` - Telegram bot token
- `ADMIN_CHAT_ID` - Admin Telegram chat ID

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL

---

## 📝 MUHIM ESLATMALAR

### ✅ QILISH KERAK
1. Har doim `useCarsNew` hook ishlatish (eski `useCarsHybrid` emas!)
2. Optimistic UI updates qilish
3. Offline support'ni hisobga olish
4. TypeScript type'larini to'g'ri ishlatish
5. Error handling qilish
6. Soft delete ishlatish (`isDeleted: true`)
7. Repository pattern'dan foydalanish
8. Comment'larni uzbek tilida yozish

### ❌ QILMASLIK KERAK
1. `any` type ishlatmaslik
2. Direct API calls (repository ishlatish kerak)
3. Hard delete (soft delete ishlatish kerak)
4. Blocking operations (async/await to'g'ri ishlatish)
5. Memory leaks (cleanup qilish kerak)
6. Inline styles (Tailwind ishlatish kerak)
7. Console.log'larni production'da qoldirmaslik

---

## 🐛 DEBUGGING

### Frontend
- React DevTools
- Redux DevTools (React Query)
- Network tab (API calls)
- IndexedDB viewer
- Console logs

### Backend
- PM2 logs: `npm run pm2:logs`
- MongoDB Compass
- Postman/Thunder Client
- Console logs

---

## 📚 FOYDALI LINKLAR

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Oxirgi yangilanish**: 2026-02-13  
**Versiya**: 2.0.1  
**Status**: ✅ Production Ready
**Dizayn**: Qizil va Qora (Red & Black Theme) - Dark/Light Mode

---

**Eslatma**: Bu fayl AI agent (men) uchun yo'riqnoma. Loyihada ishlashda bu qoidalarga amal qilaman.
