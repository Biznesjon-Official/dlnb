# ⚡ Tezkor Yechim - VPS Errorlarni Tuzatish

## Muammo
- ❌ `/api/customers` - 404 Error
- ❌ `/api/customers/stats` - 404 Error  
- ❌ `/api/cars` - 400 Error (Validation failed)

## Sabab
1. Frontend `.env.production` fayli yo'q
2. Frontend build eski (yangi kod deploy qilinmagan)

## ✅ Yechim (5 daqiqa)

### VPS'da quyidagi komandalarni bajaring:

```bash
# 1. Loyiha papkasiga o'tish
cd /path/to/project

# 2. Frontend .env.production yaratish
cat > frontend/.env.production << 'EOF'
VITE_API_URL=http://localhost:4002/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EOF

# 3. Frontend'ni qayta build qilish
cd frontend
npm run build

# 4. Backend'ni qayta ishga tushirish
cd ../backend
npm run pm2:restart

# 5. Nginx'ni reload qilish
sudo systemctl reload nginx

# 6. Tekshirish
npm run pm2:logs
```

### Yoki avtomatik deploy:

```bash
cd /path/to/project
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## Tekshirish

1. Browser'da `Ctrl + Shift + R` (hard refresh)
2. Saytni ochish: https://dalnaboyshop.biznesjon.uz
3. Login qiling va mashinalar sahifasini oching

## Agar ishlamasa

```bash
# Backend logs ko'rish
cd backend
npm run pm2:logs

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

**Muhim**: Barcha komandalarni VPS'da ishga tushiring, localhost'da emas!
