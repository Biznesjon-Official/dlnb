# 📅 KUNLIK ISHCHI TIZIMI - TO'LIQ QULLANMA

## 🎯 UMUMIY MA'LUMOT

Tizimda endi 2 xil shogird mavjud:
1. **Foizli shogird** - Mashina to'lovidan foiz oladi
2. **Kunlik ishchi** - Har kuni belgilangan summa oladi

---

## 🚀 QANDAY ISHLAYDI?

### 1️⃣ SHOGIRD QO'SHISH

**Foizli shogird:**
```
To'lov turi: [✓ Foizli ishchi]  [ Kunlik ishchi]
Foiz: 50%
```

**Kunlik ishchi:**
```
To'lov turi: [ Foizli ishchi]  [✓ Kunlik ishchi]
Kunlik ish haqi: 100,000 so'm (majburiy!)
✓ Har kuni avtomatik to'lov qo'shiladi
```

---

### 2️⃣ SHOGIRDNI KO'RISH

**Foizli shogird:**
```
💰 DAROMAD
├─ Joriy oylik: 2,500,000 so'm
├─ Jami: 15,000,000 so'm
├─ Foiz ulushi: 50%
└─ 🏆 5 mukofot
```

**Kunlik ishchi:**
```
💰 DAROMAD
├─ Joriy oylik: 3,000,000 so'm
├─ Jami: 18,000,000 so'm
├─ Kunlik ish haqi: 100,000 so'm
├─ ✓ Har kuni avtomatik to'lov
└─ 🏆 3 mukofot
```

---

### 3️⃣ SHOGIRDNI TAHRIRLASH

**Foizli shogird:**
- Foiz ulushini o'zgartirish mumkin (0-100%)

**Kunlik ishchi:**
- Kunlik ish haqini o'zgartirish mumkin (min: 1,000 so'm)

---

### 4️⃣ AVTOMATIK TO'LOV

**Har kuni soat 00:01 da:**
1. Barcha kunlik ishchilar topiladi
2. Har biriga kunlik ish haqi qo'shiladi
3. Transaction yaratiladi
4. Daromad yangilanadi

**Misol:**
```
Kun 1: +100,000 so'm → Jami: 100,000 so'm
Kun 2: +100,000 so'm → Jami: 200,000 so'm
...
Kun 30: +100,000 so'm → Jami: 3,000,000 so'm
```

---

## 🔧 TEXNIK TAFSILOTLAR

### Backend API

**Shogird yaratish:**
```javascript
POST /api/auth/users
{
  "name": "Bobur Mirzo",
  "username": "bobur",
  "phone": "998912345678",
  "password": "998912345678",
  "role": "apprentice",
  "paymentType": "daily",
  "dailyRate": 100000
}
```

**Shogirdni yangilash:**
```javascript
PATCH /api/auth/users/:id
{
  "paymentType": "daily",
  "dailyRate": 150000
}
```

**Qo'lda kunlik to'lov qo'shish (test uchun):**
```javascript
POST /api/auth/users/:id/daily-payment
```

### Cron Job

**Fayl:** `backend/src/services/dailyPaymentService.ts`

**Ishga tushirish:**
```javascript
import { startDailyPaymentCron } from './services/dailyPaymentService';
startDailyPaymentCron(); // backend/src/index.ts da
```

**Qo'lda test qilish:**
```javascript
import { addDailyPaymentManually } from './services/dailyPaymentService';
await addDailyPaymentManually(userId);
```

---

## 📊 DATABASE SCHEMA

```typescript
interface User {
  paymentType: 'percentage' | 'daily';
  percentage?: number;        // Foizli ishchi uchun
  dailyRate?: number;         // Kunlik ishchi uchun
  lastDailyPaymentDate?: Date; // Oxirgi to'lov sanasi
}
```

---

## ✅ TAYYOR FUNKSIYALAR

1. ✅ CreateApprenticeModal - kunlik ish haqi majburiy
2. ✅ EditApprenticeModal - kunlik ish haqini o'zgartirish
3. ✅ ViewApprenticeModal - kunlik ish haqini ko'rsatish
4. ✅ Apprentices sahifasi - kunlik badge
5. ✅ Backend register - paymentType va dailyRate
6. ✅ Backend updateUser - paymentType va dailyRate
7. ✅ Cron job - har kuni avtomatik to'lov
8. ✅ Manual payment API - test uchun

---

## 🧪 TEST QILISH

### 1. Kunlik ishchi yaratish
1. Apprentices sahifasiga o'ting
2. "Yangi shogird" tugmasini bosing
3. "Kunlik ishchi" ni tanlang
4. Kunlik ish haqini kiriting (masalan: 100,000)
5. "Yaratish" tugmasini bosing

### 2. Kunlik to'lovni ko'rish
1. Shogird kartasida "Ko'rish" tugmasini bosing
2. "Kunlik ish haqi: 100,000 so'm" ko'rinadi
3. "✓ Har kuni avtomatik to'lov" yozuvi ko'rinadi

### 3. Kunlik ish haqini o'zgartirish
1. Shogird kartasida "Tahrirlash" tugmasini bosing
2. Kunlik ish haqini o'zgartiring (masalan: 150,000)
3. "Saqlash" tugmasini bosing

### 4. Qo'lda to'lov qo'shish (test uchun)
```bash
# Postman yoki Thunder Client'da
POST http://localhost:4000/api/auth/users/USER_ID/daily-payment
Authorization: Bearer YOUR_TOKEN
```

### 5. Avtomatik to'lovni kutish
- Har kuni soat 00:01 da avtomatik to'lov qo'shiladi
- Yoki server'ni qayta ishga tushiring (cron job boshlanadi)

---

## 🐛 MUAMMOLARNI HAL QILISH

### Kunlik to'lov qo'shilmayapti?
1. Server ishlab turibmi? (`npm run dev`)
2. Cron job ishga tushganmi? (console'da "✅ Kunlik to'lovlar cron job ishga tushirildi")
3. `dailyRate` to'g'ri belgilanganmi? (0 dan katta bo'lishi kerak)
4. `paymentType` "daily" ga o'rnatilganmi?

### Kunlik ish haqi ko'rinmayapti?
1. Browser cache'ni tozalang (Ctrl+Shift+R)
2. Ma'lumotlar bazasida `paymentType` va `dailyRate` bormi?
3. Frontend'da types to'g'ri importlanganmi?

### Tahrirlashda xatolik?
1. Backend'da `updateUser` funksiyasi yangilanganmi?
2. Frontend'da `paymentType` va `dailyRate` yuborilayaptimi?
3. Network tab'da request'ni tekshiring

---

## 📝 ESLATMALAR

1. Kunlik ish haqi kamida 1,000 so'm bo'lishi kerak
2. Bir kunda faqat 1 marta to'lov qo'shiladi
3. Oylik reset'da kunlik to'lovlar ham arxivlanadi
4. Foizli shogirdni kunlik ishchiga o'zgartirish mumkin (va aksincha)
5. To'lov turi o'zgarganda eski ma'lumotlar tozalanadi

---

**Muallif:** Dalnoboy Shop Development Team  
**Sana:** 2024-02-13  
**Versiya:** 1.0.0
