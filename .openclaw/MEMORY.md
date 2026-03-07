Gunny project — Workspace & Auto-Deploy Model (as of 2025-04-05)

Workspace Root: /var/www/tools (folder gốc chứa nhiều dự án)
Current Project: gunny (https://github.com/dotheanh/ai_agent_playground.git)
Git credential: ✓ confirmed working (https URL with personal access token embedded)

Deploy URLs:
- Latest (release ổn định): https://nhoxtheanh.duckdns.org/gunny/
- Developing (đang dev, update liên tục): https://nhoxtheanh.duckdns.org/gunny/developing.html
- Version N (backup immutable, KHÔNG ĐƯỢC CHỈNH SỬA): https://nhoxtheanh.duckdns.org/gunny/v6/ (v6), v5, v4, v3...

Filesystem layout under /var/www/tools/gunny:
- ./versions/dev        ← CÔNG VIỆC MỚI NHẤT: chỉ sửa file ở đây
- ./versions/latest     ← Phiên bản đã publish (đọc/lập lịch update)
- ./versions/v6, v5...  ← Backup immutable (chỉ sửa khi chủ yêu cầu)

CURRENT WORK TREE:
/var/www/tools/gunny/versions/dev —这是唯一允许主动更新的目录。

git permission: ✅ confirmed (git remote -v shows https with PAT access)
- origin: https://github.com/dotheanh/ai_agent_playground.git (PAT embedded in local config)

Current local state:
- On branch: main
- Latest change: modified versions/dev/game.js (uncommitted as of first check)

Rules:
1. Chỉ sửa file trong /var/www/tools/gunny/versions/dev (trừ khi có chỉ định rõ ràng)
2. Không sửa gì ở ./versions/latest hay ./versions/vN/ nếu không được hỏi
3. Git push cần tự thực hiện sau khi hoàn tất cập nhật

=== CADDY CONFIG (2026-03-05, latest) ===

nhoxtheanh.duckdns.org {
  root * /var/www/tools
  file_server

  @mp4 path *.mp4
  header @mp4 Content-Type video/mp4

  # Portal API (strip /portal prefix before proxy to backend)
  handle /portal/api/* {
    uri strip_prefix /portal
    reverse_proxy localhost:3001
  }

  # Portal React frontend (serve from /dist, fallback to index.html)
  handle_path /portal/* {
    root * /var/www/tools/portal/client/dist
    try_files {path} /index.html
    file_server
  }

  # Gunny game
  handle_path /gunny/* {
    root * /var/www/tools/gunny
    file_server
  }
}

Cấu hình này do user cập nhật lần cuối ngày 2026-03-05 (version mới nhất). Đã ghi nhớ để dùng làm reference.

**Notes:**
- API endpoint: `/portal/api/*` → `/api/*` → localhost:3001
- Frontend: serve từ `/var/www/tools/portal/client/dist`

=== PORTAL STRUCTURE ===

/var/www/tools/portal/
├── client/     ← React frontend (Vite), build → dist/
├── server/     ← NestJS backend API (port 3001)
└── node_modules/

Client root: /var/www/tools/portal/client
Server root: /var/www/tools/portal/server
Server listen: localhost:3001

=== PORTAL PROJECT STRUCTURE ===

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: NestJS (Node.js)
- UI: Radix UI components + GSAP animations + Three.js 3D
- Build: Multi-site support (portal + zps)

**Multi-site Architecture:**
```
portal/client/src/sites/
├── portal/          # Site chính (theme đỏ)
│   ├── PortalApp.tsx
│   ├── config.ts
│   └── theme.css
└── zps/             # Site 8/3 (theme hồng)
    ├── ZpsApp.tsx
    ├── theme.css
    └── sections/
```

**Build Scripts:**
- `npm run build:portal` → /portal/ (base: /portal/)
- `npm run build:zps` → root / (base: /)
- `npm run build:all` → cả 2 sites

**Dev Ports:**
- Portal: localhost:3000
- ZPS: localhost:3002
- API: localhost:3001

=== CADDY CONFIG FULL (2026-03-07) ===

File: `/var/www/tools/portal/Caddyfile` (hoặc `/etc/caddy/Caddyfile`)

**1. zingplay.duckdns.org** (ZPS Site - 8/3)
- `/api/*` → localhost:3001
- `/portal/api/*` → localhost:3001 (strip /portal)
- Static → `/var/www/tools/zps/client/dist`

**2. nhoxtheanh.duckdns.org** (Tools - Multi-service)
- `/portal/api/*` → localhost:3001 (API backend)
- `/portal/*` → `/var/www/tools/portal/client/dist` (React SPA)
- `/gunny/*` → `/var/www/tools/gunny` (Game files)
- Default → `/var/www/tools` (static files)
- MP4 files: Content-Type header override

**Deploy flow:**
1. Build client: `npm run build:portal` / `npm run build:zps`
2. Copy dist to server: `/var/www/tools/portal/client/dist/`
3. Copy ZPS images: `public/zps/` → `/var/www/tools/zps/client/dist/zps/`
4. Restart: `pm2 restart portal-api` + `caddy reload`
