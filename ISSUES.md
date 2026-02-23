# MUAMMOLAR RO'YXATI

## 🔴 CRITICAL — Darhol tuzatish kerak

### 1. .env fayllar git tarixida
- `backend/.env` va `frontend/.env` haqiqiy credentials bilan commit qilingan
- MongoDB password, Groq API key, Telegram bot tokenlar ochiq
- **Yechim**: Barcha kalitlarni rotate qilish + git tarixdan tozalash (`git filter-branch` yoki `BFG`)

### 2. Frontend syntax xato
- `frontend/src/App.tsx:41` — `{2` bo'lishi kerak `{`
- Build buzilishi mumkin

---

## 🟡 MEDIUM — Yaqin vaqtda tuzatish

### 3. MongoDB ReDoS zaiflik
- `backend/src/controllers/sparePartController.ts:20-21` — user input to'g'ridan-to'g'ri regex'ga berilmoqda
- `{ name: { $regex: q.trim(), $options: 'i' } }` — maxsus belgilarni escape qilish kerak

### 4. Request body limit yo'q
- `backend/src/index.ts:116` — `express.json()` limitisiz
- DOS hujumga ochiqqina. **Yechim**: `express.json({ limit: '10mb' })`

### 5. Juda katta query limit
- `backend/src/controllers/sparePartController.ts:54` — `Math.min(100000, ...)`
- 100,000 document bir vaqtda — DOS. **Yechim**: max 500-1000

### 6. Math.random() xavfsizlik
- `frontend/src/components/AIChatWidget.tsx` — session ID uchun
- `frontend/src/lib/deviceFingerprint.ts` — fingerprint uchun
- `backend/src/middleware/upload.ts:28` — fayl nomlari uchun
- **Yechim**: `crypto.randomBytes()` yoki `crypto.randomUUID()`

### 7. CORS origins hardcoded
- `backend/src/index.ts:72-86` — domainlar kodda yozilgan
- **Yechim**: `ALLOWED_ORIGINS` env variable

### 8. JWT expiry hardcoded
- `backend/src/controllers/authController.ts:116,196` — `{ expiresIn: '7d' }`
- **Yechim**: env variable

### 9. Public endpoint rate limit yo'q
- `backend/src/routes/auth.ts:80` — `/public/apprentices` auth yo'q, rate limit yo'q

### 10. Console.log production'da
- 30+ faylda debug console.log'lar qolgan
- `frontend/src/lib/api.ts:100-106` — "MAJBURIY LOG" comment bilan
- `backend/src/controllers/authController.ts:165` — login credentials log qilinmoqda

---

## 🟢 LOW — Vaqt topilganda

### 11. Code splitting yo'q
- `frontend/src/App.tsx` — barcha routes static import (React.lazy yo'q)
- `frontend/vite.config.ts:147` — `manualChunks: undefined` (chunk splitting o'chirilgan)

### 12. Test fayllar yo'q
- Hech qanday `.test.ts`, `.spec.ts`, `.test.tsx` fayl topilmadi
- Kamida auth, validation, va CRUD uchun testlar kerak

### 13. Mixed import patterns
- `backend/src/routes/auth.ts:82,129` — dynamic `require()` va ES6 import aralash
- `backend/src/controllers/carController.ts:102,385,888` — xuddi shunday

### 14. localStorage error handling yo'q
- 10+ faylda `localStorage.getItem()` try-catch'siz
- Incognito/private mode'da xato berishi mumkin

### 15. sharp dependency muammo
- `sharp@^0.34.5` root package.json'da bor, lekin backend'da UNMET DEPENDENCY

### 16. Duplicate ecosystem.config.js
- Root va backend'da ikkalasi ham bor, root'dagi eskirgan (noto'g'ri path)
