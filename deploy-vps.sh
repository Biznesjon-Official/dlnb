#!/bin/bash

# VPS Deploy Script
# Bu skript VPS'da loyihani deploy qilish uchun

echo "🚀 VPS Deploy boshlandi..."

# 1. Git pull (yangilanishlarni olish)
echo "📥 Git pull..."
git pull origin main

# 2. Backend dependencies
echo "📦 Backend dependencies o'rnatilmoqda..."
cd backend
npm install
echo "✅ Backend dependencies o'rnatildi"

# 3. Backend build
echo "🔨 Backend build qilinmoqda..."
npm run build
echo "✅ Backend build tugadi"

# 4. Frontend dependencies
echo "📦 Frontend dependencies o'rnatilmoqda..."
cd ../frontend
npm install
echo "✅ Frontend dependencies o'rnatildi"

# 5. Frontend build (production)
echo "🔨 Frontend build qilinmoqda..."
npm run build
echo "✅ Frontend build tugadi"

# 6. Backend restart (PM2)
echo "🔄 Backend qayta ishga tushirilmoqda..."
cd ../backend
npm run pm2:restart
echo "✅ Backend qayta ishga tushdi"

# 7. Nginx reload (agar kerak bo'lsa)
echo "🔄 Nginx reload..."
sudo systemctl reload nginx
echo "✅ Nginx reload tugadi"

echo "✅ Deploy muvaffaqiyatli tugadi!"
echo "🌐 Sayt: https://dalnaboyshop.biznesjon.uz"
