# Multi-Site Setup Guide

## Quick Start

### Chạy Development (2 cửa sổ terminal riêng):

**Terminal 1 - Portal Site (port 3000):**
```bash
cd portal/client
npm run dev:portal
# Truy cập: http://localhost:3000/portal/
```

**Terminal 2 - ZPS Site (port 3002):**
```bash
cd portal/client
npm run dev:zps
# Truy cập: http://localhost:3002/portal/
```

**Terminal 3 - API Server (chạy 1 lần):**
```bash
cd portal/server
npm run start:dev
# API: http://localhost:3001
```

### Chạy cả 2 site + server cùng lúc:

```bash
# Terminal 1: Chạy server
cd portal/server && npm run start:dev

# Terminal 2: Chạy portal site
cd portal/client && npm run dev:portal

# Terminal 3: Chạy zps site
cd portal/client && npm run dev:zps
```

---

## Build cho Production

```bash
# Build portal
npm run build:portal  # → dist/

# Build ZPS
npm run build:zps    # → dist/
```

---

## Cấu trúc files

```
portal/client/
├── src/
│   ├── sites/
│   │   ├── portal/
│   │   │   ├── config.ts    # Content config
│   │   │   └── theme.css    # Theme colors
│   │   └── zps/
│   │       ├── config.ts    # Content config
│   │       └── theme.css    # Theme colors
│   ├── config.ts            # Dynamic loader
│   ├── index.css           # Base styles
│   └── main.tsx            # Entry point
├── .env.portal             # Portal env
└── .env.zps               # ZPS env
```

---

## Thêm site mới

1. Tạo folder mới: `src/sites/new-site/`
2. Copy `config.ts` và `theme.css` từ site có sẵn
3. Chỉnh sửa content và màu sắc
4. Thêm vào `package.json` scripts: `"dev:new-site": "vite --mode new-site"`
5. Thêm port vào `vite.config.ts`
