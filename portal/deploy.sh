#!/bin/bash
# =============================================================================
# Deploy script for multi-site portal
# Run on server: bash deploy.sh
# =============================================================================

set -e

# Config
PROJECT_DIR="/var/www/tools/portal"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_DIR="$PROJECT_DIR/server"
PORTAL_DIST="/var/www/tools/portal/client/dist"
ZPS_DIST="/var/www/tools/zps/client/dist"

echo "=========================================="
echo "  Multi-site Deploy"
echo "=========================================="

# 1. Pull latest code
echo ""
echo "[1/6] Pulling latest code..."
cd "$PROJECT_DIR/.."
git pull

# 2. Install dependencies
echo ""
echo "[2/6] Installing dependencies..."
cd "$CLIENT_DIR" && npm ci --silent
cd "$SERVER_DIR" && npm ci --silent

# 3. Build server
echo ""
echo "[3/6] Building server..."
cd "$SERVER_DIR"
npm run build

# 4. Build portal site
echo ""
echo "[4/6] Building portal site..."
cd "$CLIENT_DIR"
npm run build:portal
# Portal dist stays in place at /var/www/tools/portal/client/dist/

# 5. Build ZPS site
echo ""
echo "[5/6] Building ZPS site..."
# Backup portal dist
mv dist dist-portal

# Build zps
npm run build:zps

# Move zps dist to target
mkdir -p "$ZPS_DIST"
rm -rf "$ZPS_DIST"
mv dist "$ZPS_DIST"

# Restore portal dist
mv dist-portal dist

# 6. Restart services
echo ""
echo "[6/6] Restarting services..."
# Restart API server (adjust command to your setup)
if command -v pm2 &> /dev/null; then
    pm2 restart portal-api 2>/dev/null || pm2 start "$SERVER_DIR/dist/main.js" --name portal-api
elif command -v systemctl &> /dev/null; then
    sudo systemctl restart portal-api 2>/dev/null || true
fi

# Reload Caddy
if command -v caddy &> /dev/null; then
    caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "  Deploy complete!"
echo "  Portal: https://nhoxtheanh.duckdns.org/portal/"
echo "  ZPS:    https://zingplay.duckdns.org/"
echo "=========================================="
