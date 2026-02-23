# DLNB — VPS Deploy

## Talablar
- Ubuntu 20.04+ VPS
- Domain DNS: `dalnaboyshop.biznesjon.uz` → VPS IP
- SSH kaliti GitHub ga qo'shilgan

## Birinchi marta deploy
```bash
# 1. VPS ga SSH bilan kirish
ssh user@VPS_IP

# 2. Deploy scriptni yuklash va ishga tushirish
git clone git@github.com:Biznesjon-Official/dlnb.git /var/www/dlnb
cd /var/www/dlnb
chmod +x deploy/deploy.sh
./deploy/deploy.sh setup

# 3. .env fayllarni to'ldirish
nano /var/www/dlnb/backend/.env
# (barcha API kalitlar, MongoDB URI, JWT_SECRET ni yozing)

# 4. Backend qayta ishga tushirish
pm2 restart dlnb-backend
```

## Yangilash
```bash
cd /var/www/dlnb
./deploy/deploy.sh update
```

## Foydali komandalar
```bash
pm2 status              # PM2 holati
pm2 logs dlnb-backend   # Backend loglar
pm2 restart dlnb-backend # Qayta ishga tushirish
sudo nginx -t           # Nginx config tekshirish
sudo systemctl reload nginx # Nginx qayta yuklash
sudo certbot renew      # SSL yangilash
```
