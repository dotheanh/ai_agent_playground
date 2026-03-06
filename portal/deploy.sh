#!/bin/bash
# =============================================================================
# Deploy script for multi-site portal
# Usage:
#   bash deploy.sh          # Full deploy (pull + build all + restart)
#   bash deploy.sh portal   # Build & deploy portal only
#   bash deploy.sh zps      # Build & deploy zps only
#   bash deploy.sh client   # Build & deploy both clients (no server)
# =============================================================================

set -e

ROOT_DIR="/var/www/tools"
PROJECT_DIR="$ROOT_DIR/portal"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_DIR="$PROJECT_DIR/server"
ZPS_DIST="$ROOT_DIR/zps/client/dist"

SITE="$1"

build_portal() {
  echo "[*] Building portal site (base: /portal/)..."
  cd "$CLIENT_DIR"
  npm run build:portal
  echo "[+] Portal done -> $CLIENT_DIR/dist/"
}

build_zps() {
  echo "[*] Building ZPS site (base: /)..."
  cd "$CLIENT_DIR"

  # Backup portal dist if exists
  [ -d dist ] && mv dist dist-portal

  npm run build:zps

  # Move zps dist to target
  rm -rf "$ZPS_DIST"
  mkdir -p "$ZPS_DIST"
  mv dist/* "$ZPS_DIST/"
  rmdir dist

  # Restore portal dist
  [ -d dist-portal ] && mv dist-portal dist

  echo "[+] ZPS done -> $ZPS_DIST/"
}

echo "=========================================="
echo "  Multi-site Deploy"
echo "=========================================="

# Pull latest code
if [ -z "$SITE" ]; then
  echo ""
  echo "[1] Pulling latest code..."
  cd "$ROOT_DIR"
  git pull
fi

# Install client dependencies
if [ "$SITE" != "server" ]; then
  echo ""
  echo "[2] Installing client dependencies..."
  cd "$CLIENT_DIR"
  npm ci --silent
fi

# Build based on argument
case "$SITE" in
  portal)
    echo ""
    build_portal
    ;;
  zps)
    echo ""
    build_zps
    ;;
  client)
    echo ""
    build_portal
    echo ""
    build_zps
    ;;
  *)
    # Full deploy: server + both clients
    echo ""
    echo "[3] Building server..."
    cd "$SERVER_DIR"
    npm ci --silent
    npm run build

    echo ""
    build_portal
    echo ""
    build_zps

    # Restart services
    echo ""
    echo "[4] Restarting services..."
    if command -v pm2 &> /dev/null; then
      pm2 restart portal-api 2>/dev/null || pm2 start "$SERVER_DIR/dist/main.js" --name portal-api
    fi
    if command -v caddy &> /dev/null; then
      caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true
    fi
    ;;
esac

echo ""
echo "=========================================="
echo "  Done!"
echo "  Portal: https://nhoxtheanh.duckdns.org/portal/"
echo "  ZPS:    https://zingplay.duckdns.org/"
echo "=========================================="
