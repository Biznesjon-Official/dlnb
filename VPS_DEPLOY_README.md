# VPS Deploy Yo'riqnomasi

## Muammolar va Yechimlar

### 1. 404 Error - `/api/customers` topilmayapti

**Sabab**: Frontend `VITE_API_URL` noto'g'ri yoki o'rnatilmagan

**Yechim**:
```bash
# VPS'da frontend/.env.production faylini yaratish
cd /path/to/project/frontend
nano .env.production
```

Quyidagi kontent qo'shing:
```env
VITE_API_URL=http://localhost:4002/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. 400 Error - Car validation

**Sabab**: Frontend build eski, yangi kod deploy qilinmagan

**Yechim**:
```bash
# Frontend'ni qayta build qilish
cd /path/to/project/frontend
npm run build

# Nginx'ni reload qilish
sudo systemctl reload nginx
```

### 3. Backend PORT farqi

**Sabab**: Production'da PORT 4002, development'da 4000

**Yechim**: `backend/.env.production` faylida to'g'ri PORT o'rnatilgan:
```env
PORT=4002
HOST=0.0.0.0
```

## Deploy Jarayoni

### Avtomatik Deploy (Tavsiya etiladi)

```bash
# Deploy skriptini ishga tushirish
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Manual Deploy

#### 1. Git Pull
```bash
cd /path/to/project
git pull origin main
```

#### 2. Backend Deploy
```bash
cd backend
npm install
npm run build
npm run pm2:restart
```

#### 3. Frontend Deploy
```bash
cd ../frontend
npm install
npm run build
```

#### 4. Nginx Reload
```bash
sudo systemctl reload nginx
```

## Environment Variables Tekshirish

### Backend (.env.production)
```bash
cd backend
cat .env.production
```

Kerakli o'zgaruvchilar:
- `PORT=4002`
- `HOST=0.0.0.0`
- `MONGO_URI=mongodb://localhost:27019/car-repair-workshop`
- `JWT_SECRET=...` (min 64 chars)
- `NODE_ENV=production`

### Frontend (.env.production)
```bash
cd frontend
cat .env.production
```

Kerakli o'zgaruvchilar:
- `VITE_API_URL=http://localhost:4002/api`

## Logs Tekshirish

### Backend Logs (PM2)
```bash
cd backend
npm run pm2:logs
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Logs
```bash
sudo journalctl -u mongod -f
```

## Xatoliklarni Tuzatish

### 1. Backend ishlamayapti
```bash
# PM2 statusni tekshirish
cd backend
npm run pm2:status

# Qayta ishga tushirish
npm run pm2:restart

# Logs ko'rish
npm run pm2:logs
```

### 2. Frontend 404 error
```bash
# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx'ni qayta ishga tushirish
sudo systemctl restart nginx
```

### 3. MongoDB ulanmayapti
```bash
# MongoDB statusni tekshirish
sudo systemctl status mongod

# MongoDB'ni ishga tushirish
sudo systemctl start mongod
```

### 4. API 400/500 errors
```bash
# Backend logs'ni ko'rish
cd backend
npm run pm2:logs

# Environment variables tekshirish
cat .env.production
```

## Production Checklist

- [ ] Git pull qilindi
- [ ] Backend dependencies o'rnatildi
- [ ] Backend build qilindi
- [ ] Frontend dependencies o'rnatildi
- [ ] Frontend build qilindi
- [ ] Backend PM2 restart qilindi
- [ ] Nginx reload qilindi
- [ ] Logs tekshirildi
- [ ] Sayt ishlayapti: https://dalnaboyshop.biznesjon.uz

## Foydali Komandalar

```bash
# Barcha servislarni tekshirish
sudo systemctl status nginx
sudo systemctl status mongod
cd backend && npm run pm2:status

# Disk space tekshirish
df -h

# Memory usage tekshirish
free -h

# Process'larni ko'rish
ps aux | grep node
ps aux | grep nginx
ps aux | grep mongod
```

## Muammolar

Agar muammolar davom etsa:

1. Backend logs'ni tekshiring: `cd backend && npm run pm2:logs`
2. Nginx logs'ni tekshiring: `sudo tail -f /var/log/nginx/error.log`
3. MongoDB logs'ni tekshiring: `sudo journalctl -u mongod -f`
4. Environment variables'ni tekshiring
5. Port'lar band emasligini tekshiring: `sudo netstat -tulpn | grep :4002`

---

**Oxirgi yangilanish**: 2026-02-19
**Versiya**: 1.0.0
