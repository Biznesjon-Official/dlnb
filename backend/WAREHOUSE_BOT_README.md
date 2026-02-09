# 🤖 OMBOR TELEGRAM BOT

Ombordagi zapchastlarni Telegram orqali ko'rish va boshqarish uchun bot.

## 📋 Xususiyatlar

### ✅ Asosiy Funksiyalar
- 📦 **Barcha zapchastlar** - To'liq ro'yxat (sahifalash bilan)
- ⚠️ **Kam qolganlar** - 5 tadan kam qolgan zapchastlar
- 📊 **Statistika** - Umumiy ma'lumotlar
- 🔍 **Qidirish** - Nom, razmer, brend bo'yicha
- 🔧 **Kategoriyalar** - Zapchastlar va balonlar alohida
- 🛞 **Balon ma'lumotlari** - Razmer, brend, turi

### 🎯 Buyruqlar
```
/start - Asosiy menyu
/list - Barcha zapchastlar
/low - Kam qolgan zapchastlar
/stats - Statistika
/search [nom] - Qidirish
/help - Yordam
```

### 📱 Inline Tugmalar
- Sahifalash (Oldingi/Keyingi)
- Kategoriya filtrlari
- Asosiy menyuga qaytish

## 🚀 O'rnatish

### 1. Bot Token Olish
1. [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: "Dalnoboy Warehouse Bot")
4. Username kiriting (masalan: `dalnoboy_warehouse_bot`)
5. Token oling va saqlang

### 2. Chat ID Olish
1. [@userinfobot](https://t.me/userinfobot) ga boring
2. `/start` yuboring
3. Chat ID'ni ko'chirib oling

### 3. Environment Variables
`.env` faylga qo'shing:
```env
TELEGRAM_BOT_TOKEN_WAREHOUSE=8320230881:AAGcW8xTnGc97IReaL140mLs1RrHvcr5ZAk
WAREHOUSE_ADMIN_CHAT_ID=7935196609
```

### 4. Backend'ni Ishga Tushirish
```bash
cd backend
npm run dev
```

## 📊 Bot Strukturasi

```
backend/src/services/
└── warehouseBotService.ts  # Asosiy bot logikasi
```

### Asosiy Funksiyalar

#### 1. `initializeWarehouseBot()`
Bot'ni ishga tushiradi va komandalarni sozlaydi.

#### 2. `sendMainMenu(chatId, messageId?)`
Asosiy menyuni ko'rsatadi.

#### 3. `sendSparePartsList(chatId, page, messageId?)`
Zapchastlar ro'yxatini sahifalash bilan ko'rsatadi.

#### 4. `sendLowStockParts(chatId, messageId?)`
Kam qolgan zapchastlarni ko'rsatadi (quantity < 5).

#### 5. `sendStatistics(chatId, messageId?)`
Umumiy statistikani ko'rsatadi:
- Jami zapchastlar soni
- Jami miqdor
- Umumiy qiymat
- Kategoriyalar bo'yicha

#### 6. `sendPartsByCategory(chatId, category, messageId?)`
Kategoriya bo'yicha zapchastlarni ko'rsatadi (balon/zapchast).

#### 7. `searchSpareParts(chatId, query)`
Nom, razmer yoki brend bo'yicha qidiradi.

## 🎨 Xabar Formati

### Zapchast Ma'lumotlari
```
1. Tormoz kolodkasi ⚠️
   💰 Narx: 150,000 so'm
   📊 Soni: 3 dona
```

### Balon Ma'lumotlari
```
1. Michelin Primacy 4
   💰 Narx: 1,200,000 so'm
   📊 Soni: 8 dona
   🛞 Razmer: 205/55 R16
   🏷️ Brend: Michelin
```

### Kam Qolgan Zapchastlar
```
🔴 - Tugagan (0 dona)
🟠 - Juda kam (1-2 dona)
🟡 - Kam (3-4 dona)
```

## 🔧 Texnik Ma'lumotlar

### Dependencies
- `node-telegram-bot-api` - Telegram Bot API
- `mongoose` - MongoDB bilan ishlash

### MongoDB Model
`SparePart` modelidan foydalanadi:
- `name` - Zapchast nomi
- `sellingPrice` - Sotish narxi
- `quantity` - Miqdor
- `currency` - Valyuta (UZS/USD)
- `category` - Kategoriya (balon/zapchast/boshqa)
- `tireFullSize` - Balon razmeri
- `tireBrand` - Balon brendi
- `unit` - O'lchov birligi

### Polling Mode
Bot polling rejimida ishlaydi (webhook emas).

## 🐛 Debugging

### Bot Ishlamasa
1. Token to'g'ri ekanligini tekshiring
2. Bot'ni @BotFather orqali ishga tushiring
3. Backend console'da xatolarni ko'ring
4. MongoDB ulanganligini tekshiring

### Console Logs
```
✅ Ombor Telegram Bot ishga tushdi!
⚠️ TELEGRAM_BOT_TOKEN_WAREHOUSE topilmadi
❌ Telegram Bot polling error: ...
```

## 📝 Misol Foydalanish

### 1. Bot'ni Boshlash
```
/start
```
Asosiy menyu ko'rinadi.

### 2. Barcha Zapchastlarni Ko'rish
```
/list
```
yoki "📦 Barcha zapchastlar" tugmasini bosing.

### 3. Qidirish
```
/search tormoz
/search R15
/search Michelin
```

### 4. Kam Qolganlarni Ko'rish
```
/low
```
yoki "⚠️ Kam qolganlar" tugmasini bosing.

### 5. Statistika
```
/stats
```
yoki "📊 Statistika" tugmasini bosing.

## 🔐 Xavfsizlik

- Bot faqat `.env` faylda ko'rsatilgan chat ID'ga javob beradi
- Token'lar `.env` faylda saqlanadi (git'ga yuklanmaydi)
- Production'da HTTPS ishlatiladi

## 🚀 Production Deploy

### 1. Environment Variables
Production server'da `.env` faylni yarating:
```env
TELEGRAM_BOT_TOKEN_WAREHOUSE=your_token_here
WAREHOUSE_ADMIN_CHAT_ID=your_chat_id_here
```

### 2. PM2 bilan Ishga Tushirish
```bash
cd backend
npm run build
npm run pm2:start
```

### 3. Logs Ko'rish
```bash
npm run pm2:logs
```

## 📚 Qo'shimcha Ma'lumotlar

### Telegram Bot API
- [Official Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

### MongoDB Queries
Bot MongoDB'dan to'g'ridan-to'g'ri ma'lumot oladi:
- `find()` - Ro'yxat olish
- `countDocuments()` - Soni
- `aggregate()` - Statistika

## 🎯 Kelajakdagi Yangilanishlar

- [ ] Zapchast qo'shish (admin uchun)
- [ ] Zapchast tahrirlash
- [ ] Zapchast o'chirish
- [ ] Sotish tarixi
- [ ] Excel export
- [ ] Rasm yuklash
- [ ] Webhook mode (polling o'rniga)
- [ ] Multi-language support

---

**Versiya**: 1.0.0  
**Sana**: 2026-02-09  
**Muallif**: Dalnoboy Shop Team
