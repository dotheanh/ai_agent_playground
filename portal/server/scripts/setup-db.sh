#!/usr/bin/env bash
set -euo pipefail

# Setup DB from scratch for portal/server
# - recreates SQLite/SQL.js db file
# - relies on TypeORM synchronize=true to create schema on app boot
# - then imports seed data (JSON) to match prod/dev sample data

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$HERE/portal.db"
SEED_PATH="$HERE/../seed/portal_seed.json"

echo "[setup-db] server dir: $HERE"

echo "[setup-db] removing db: $DB_PATH"
rm -f "$DB_PATH"

# Create schema by booting the app briefly (synchronize=true)
# We start Nest in the background, wait a moment, then stop.

echo "[setup-db] booting Nest once to create schema (TypeORM synchronize=true)"
node "$HERE/dist/main.js" >/tmp/portal-db-setup.log 2>&1 &
PID=$!

# wait up to ~5s
for i in {1..10}; do
  if [[ -f "$DB_PATH" ]]; then
    break
  fi
  sleep 0.5
done

# stop server
kill "$PID" >/dev/null 2>&1 || true
wait "$PID" >/dev/null 2>&1 || true

if [[ ! -f "$DB_PATH" ]]; then
  echo "[setup-db] ERROR: DB was not created. Check /tmp/portal-db-setup.log"
  exit 1
fi

echo "[setup-db] importing seed: $SEED_PATH"
python3 "$HERE/seed_from_db.py" import --seed "$SEED_PATH" --db "$DB_PATH"

echo "[setup-db] DONE"
