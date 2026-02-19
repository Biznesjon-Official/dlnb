# VPS Muammolarni Tuzatish Komandalar

## Muammo: 404 va 400 Errorlar

### Sabab:
1. Frontend `.env.production` fayli yo'q
2. Frontend build eski
3. Backend va frontend PORT farqi

### Yechim:

## 1. Frontend .env.production yaratish

```bash
# VPS'ga SSH orqali kirish
ssh user@your-vps-ip

# Loyiha papkasiga o'tish
cd /path/to/project/frontend

# .env.production faylini yaratish
cat > .env.production << 'EOF'
VITE_API_URL=http://localhost:4002/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EOF

# Faylni tekshirish
cat .env.production
```

## 2. Frontend'ni qayta build qilish

```bash
# Frontend papkasida
cd /path/to/project/frontend

# Dependencies o'rnatish (agar kerak bo'lsa)
npm install

# Build qilish (production mode)
npm run build

# Build natijasini tekshirish
ls -la dist/
```

## 3. Backend'ni qayta ishga tushirish

```bash
# Backend papkasiga o'tish
cd /path/to/project/backend

# PM2 orqali qayta ishga tushirish
npm run pm2:restart

# Yoki to'liq restart
npm run pm2:stop
npm run pm2:start

# Status tekshirish
npm run pm2:status

# Logs ko'rish
npm run pm2:logs
```

## 4. Nginx'ni reload qilish

```bash
# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx'ni reload qilish
sudo systemctl reload nginx

# Yoki to'liq restart
sudo systemctl restart nginx

# Status tekshirish
sudo systemctl status nginx
```

## 5. Barcha servislarni tekshirish

```bash
# MongoDB
sudo systemctl status mongod

# Nginx
sudo systemctl status nginx

# Backend (PM2)
cd /path/to/project/backend
npm run pm2:status
```

## 6. Logs tekshirish

```bash
# Backend logs
cd /path/to/project/backend
npm run pm2:logs

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo journalctl -u mongod -f
```

## 7. Port'larni tekshirish

```bash
# Backend port (4002)
sudo netstat -tulpn | grep :4002

# Nginx port (80, 443)
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# MongoDB port (27019)
sudo netstat -tulpn | grep :27019
```

## 8. Browser cache tozalash

Frontend'da o'zgarishlar ko'rinmasa:

1. Browser'da `Ctrl + Shift + R` (hard refresh)
2. Browser cache tozalash
3. Incognito/Private mode'da ochish

## 9. API test qilish

```bash
# Health check
curl http://localhost:4002/api/health

# Customers endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4002/api/customers

# Cars endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4002/api/cars
```

## 10. Environment variables tekshirish

```bash
# Backend
cd /path/to/project/backend
cat .env.production

# Frontend
cd /path/to/project/frontend
cat .env.production
```

## Avtomatik Deploy Skript

```bash
# Deploy skriptini ishlatish
cd /path/to/project
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## Agar hali ham ishlamasa

1. **Backend logs'ni diqqat bilan o'qing**:
   ```bash
   cd backend
   npm run pm2:logs
   ```

2. **Nginx error logs'ni tekshiring**:
   ```bash
   sudo tail -100 /var/log/nginx/error.log
   ```

3. **MongoDB ulanishini tekshiring**:
   ```bash
   sudo systemctl status mongod
   ```

4. **Disk space tekshiring**:
   ```bash
   df -h
   ```

5. **Memory tekshiring**:
   ```bash
   free -h
   ```

## Tez-tez uchraydigan xatolar

### 1. "Cannot connect to backend"
- Backend ishlamayapti: `npm run pm2:restart`
- Port band: `sudo netstat -tulpn | grep :4002`
- Firewall: `sudo ufw status`

### 2. "404 Not Found"
- Nginx konfiguratsiyasi noto'g'ri
- Frontend build yo'q
- Route noto'g'ri

### 3. "500 Internal Server Error"
- Backend error: logs tekshiring
- MongoDB ulanmayapti
- Environment variables noto'g'ri

### 4. "CORS Error"
- Backend CORS konfiguratsiyasi
- Frontend API_URL noto'g'ri

---

**Eslatma**: Barcha komandalarni VPS'da ishga tushiring!
