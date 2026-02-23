# DLNB - Dalnoboy Shop

## Stack
- **Backend**: Express 4.18 + TypeScript + MongoDB (Mongoose) + JWT
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + React Query 5
- **Infra**: Docker, PM2, Nginx, PWA (offline-first)
- **Integrations**: Telegram Bot API, Groq AI SDK, Google Maps

## Struktura
```
backend/src/
  controllers/   # Route handlers (carController, authController, ...)
  models/        # Mongoose models (20 ta: Car, User, Debt, Task, SparePart, ...)
  routes/        # Express routes
  middleware/    # auth.ts (JWT), rateLimiter, security, upload, validation
  services/     # telegramService, debtService, monthlyResetService, warehouseBotService
  scripts/      # DB utilities (seed, delete, reset)
  config/       # database.ts
  index.ts      # Entry point (port 4000)

frontend/src/
  components/    # 60+ React komponentlar
  pages/         # master/ (Dashboard, Warehouse, Cashier, Apprentices) + apprentice/
  hooks/         # useCarsNew, useDebts, useTasks, useSpareParts, useTransactions, ...
  lib/
    repositories/  # BaseRepository, CarsRepository (offline-first CRUD)
    sync/          # SyncManager, QueueManager, NetworkManager
    storage/       # IndexedDBManager
    api.ts         # Axios instance + interceptors
  contexts/      # AuthContext, ThemeContext
  types/         # Global TypeScript types
```

## Asosiy qoidalar
- `useCarsNew` hook ishlatish (eski `useCarsHybrid` emas)
- Soft delete: `isDeleted: true` (hard delete qilmaslik)
- Repository pattern orqali CRUD (direct API call emas)
- Optimistic UI + offline fallback (IndexedDB)
- TypeScript strict: `any` ishlatmaslik
- Tailwind CSS: inline style emas
- Dark/Light mode: isDarkMode conditional styling
- Dizayn: Qizil-Qora tema (dark), Pushti-Oq (light)

## Dev commands
```bash
npm run dev          # Root: frontend + backend concurrently
cd backend && npm run dev   # Faqat backend (nodemon)
cd frontend && npm run dev  # Faqat frontend (vite)
cd backend && npm run build # TypeScript compile
```

## Environment
- Backend .env: PORT, MONGO_URI, JWT_SECRET, GROQ_API_KEY, TELEGRAM_BOT_TOKEN_*, ADMIN_CHAT_ID
- Frontend .env: VITE_API_URL, VITE_GOOGLE_MAPS_API_KEY

## User roles
- `master` — barcha huquqlar
- `apprentice` — cheklangan (faqat o'z sahifalari)

## Muhim patterns
- Transaction yaratish: har bir to'lov = yangi transaction
- Qarz: mashina to'lanmasa avtomatik yaratiladi
- Oylik reset: barcha ma'lumotlar arxivlanadi (MonthlyHistory)
- Telegram: mashina yaratish/to'lov/qarz o'zgarishi = avtomatik xabar
