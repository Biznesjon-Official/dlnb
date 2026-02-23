#!/bin/bash
# DLNB - VPS Deploy Script
# Domain: dalnaboyshop.biznesjon.uz
# Stack: PM2 + Nginx + Let's Encrypt

set -e

APP_DIR="/var/www/dlnb"
DOMAIN="dalnaboyshop.biznesjon.uz"
REPO_URL="git@github.com:Biznesjon-Official/dlnb.git"
PM2_APP="dlnb-backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DLNB]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ============================================
# BIRINCHI MARTA DEPLOY (setup)
# ============================================
setup() {
    log "=== DLNB - Birinchi marta deploy ==="

    # 1. System packages
    log "1/7 - System packages o'rnatilmoqda..."
    sudo apt update
    sudo apt install -y curl git nginx certbot python3-certbot-nginx

    # 2. Node.js 18 LTS
    log "2/7 - Node.js 18 LTS o'rnatilmoqda..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    node -v

    # 3. PM2 global
    log "3/7 - PM2 o'rnatilmoqda..."
    sudo npm install -g pm2

    # 4. Clone repo
    log "4/7 - Repo clone qilinmoqda..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    if [ ! -d "$APP_DIR/.git" ]; then
        git clone $REPO_URL $APP_DIR
    fi

    # 5. Install & Build
    log "5/7 - Dependencies o'rnatilmoqda va build qilinmoqda..."
    cd $APP_DIR
    cd backend && npm ci && npm run build && cd ..
    cd frontend && npm ci && npm run build && cd ..

    # 6. Environment files
    log "6/7 - Environment fayllarni sozlang!"
    if [ ! -f "$APP_DIR/backend/.env" ]; then
        cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
        warn "backend/.env yaratildi - MUHIM: .env ni to'ldiring!"
        warn "  nano $APP_DIR/backend/.env"
    fi
    if [ ! -f "$APP_DIR/frontend/.env" ]; then
        cp $APP_DIR/frontend/.env.example $APP_DIR/frontend/.env
        warn "frontend/.env yaratildi - VITE_API_URL ni to'ldiring!"
        warn "  nano $APP_DIR/frontend/.env"
    fi

    # 7. Nginx + SSL
    log "7/7 - Nginx sozlanmoqda..."
    sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/dlnb
    sudo ln -sf /etc/nginx/sites-available/dlnb /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx

    log "SSL sertifikat olish..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        warn "Certbot ishlamadi. Qo'lda bajaring: sudo certbot --nginx -d $DOMAIN"
    }

    # Create uploads & logs directories
    mkdir -p $APP_DIR/backend/uploads
    mkdir -p $APP_DIR/backend/logs

    # Start PM2
    log "PM2 ishga tushirilmoqda..."
    cd $APP_DIR/backend
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup | tail -1 | bash || true

    log "=== Deploy tugadi! ==="
    log "Sayt: https://$DOMAIN"
    log ""
    warn "MUHIM: backend/.env ni to'ldiring va pm2 restart $PM2_APP"
}

# ============================================
# YANGILASH (update)
# ============================================
update() {
    log "=== DLNB - Yangilanmoqda ==="
    cd $APP_DIR

    # Git pull
    log "1/4 - Kodlar yangilanmoqda..."
    git pull origin main

    # Backend build
    log "2/4 - Backend build..."
    cd backend && npm ci && npm run build && cd ..

    # Frontend build
    log "3/4 - Frontend build..."
    cd frontend && npm ci && npm run build && cd ..

    # PM2 restart
    log "4/4 - Backend qayta ishga tushirilmoqda..."
    pm2 restart $PM2_APP

    log "=== Yangilash tugadi! ==="
}

# ============================================
# STATUS
# ============================================
status() {
    log "=== DLNB Status ==="
    echo ""
    echo "PM2:"
    pm2 status $PM2_APP
    echo ""
    echo "Nginx:"
    sudo systemctl status nginx --no-pager -l | head -5
    echo ""
    echo "Disk:"
    df -h $APP_DIR
    echo ""
    echo "Backend logs (oxirgi 10 qator):"
    pm2 logs $PM2_APP --lines 10 --nostream
}

# ============================================
# USAGE
# ============================================
case "$1" in
    setup)
        setup
        ;;
    update)
        update
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {setup|update|status}"
        echo ""
        echo "  setup   - Birinchi marta VPS sozlash"
        echo "  update  - Kod yangilash (git pull + build + restart)"
        echo "  status  - Loyiha holatini ko'rish"
        exit 1
        ;;
esac
