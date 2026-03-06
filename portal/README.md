# AlexPlayground Portal

Multi-site React application với support cho nhiều sites (portal, zps).

## 🚀 Quick Start

### Development

**Terminal 1 - Server API:**
```bash
cd portal/server
npm run start:dev
# → API: http://localhost:3001
```

**Terminal 2 - Portal Site:**
```bash
cd portal/client
npm run dev:portal
# → http://localhost:3000/portal/
```

**Terminal 3 - ZPS Site (8/3):**
```bash
cd portal/client
npm run dev:zps
# → http://localhost:3002/portal/
```

---

## 📦 Build cho Production

### Build Client

**Portal Site (nhoxtheanh.duckdns.org/portal/):**
```bash
cd portal/client
npm run build:portal
# → Output: dist/ (base: /portal/)
```

**ZPS Site (zingplay.duckdns.org/):**
```bash
cd portal/client
npm run build:zps
# → Output: dist/ (base: /)
```

### Build Server

```bash
cd portal/server
npm run build
# → Output: dist/
```

---

## 🌐 Deploy với Caddy

### Cấu trúc thư mục trên server

```
/var/www/tools/
├── portal/
│   └── client/dist/          # Portal site (base: /portal/)
├── zps/
│   └── client/dist/          # ZPS site (base: /)
├── gunny/                   # Game files
└── index.html               # Static files
```

### Caddyfile

```caddyfile
# ============================================
# Zingplay - serve ZPS tại root (/)
# ============================================
zingplay.duckdns.org {
	root * /var/www/tools/zps/client/dist
	file_server
	try_files {path} {path}/ /index.html
}

# ============================================
# Tools - serve Portal tại /portal/
# ============================================
nhoxtheanh.duckdns.org {

	root * /var/www/tools
	file_server

	@mp4 path *.mp4
	header @mp4 Content-Type video/mp4

	# Portal API
	handle /portal/api/* {
		uri strip_prefix /portal
		reverse_proxy localhost:3001
	}

	# Portal React frontend
	handle_path /portal/* {
		root * /var/www/tools/portal/client/dist
		try_files {path} {path}/ /index.html
		file_server
	}

	# Gunny game
	handle_path /gunny/* {
		root * /var/www/tools/gunny
		file_server
	}
}
```

### Deploy Steps

1. **Build cả hai sites:**
   ```bash
   # Build portal
   cd portal/client && npm run build:portal

   # Build zps
   cd portal/client && npm run build:zps
   ```

2. **Upload lên server:**
   ```bash
   # Copy portal dist
   scp -r portal/client/dist/* user@server:/var/www/tools/portal/client/dist/

   # Copy zps dist
   scp -r portal/client/dist/* user@server:/var/www/tools/zps/client/dist/
   ```

3. **Copy images cho zps:**
   ```bash
   # Cần copy images từ public/zps/
   scp -r portal/client/public/zps/* user@server:/var/www/tools/zps/client/dist/zps/
   ```

4. **Restart server:**
   ```bash
   # Restart API server
   ssh user@server "pm2 restart portal-api"

   # Reload Caddy
   ssh user@server "caddy reload"
   ```

---

## 🏗️ Multi-site Architecture

### Cấu trúc thư mục

```
portal/client/
├── src/
│   ├── sites/
│   │   ├── portal/          # Site gốc (đỏ)
│   │   │   ├── PortalApp.tsx
│   │   │   ├── config.ts
│   │   │   └── theme.css
│   │   └── zps/             # Site 8/3 (hồng)
│   │       ├── ZpsApp.tsx
│   │       ├── config.ts    # Content từ portal/app
│   │       ├── theme.css    # Style từ portal/app
│   │       ├── components/
│   │       │   └── HeartParticles.tsx
│   │       └── sections/    # 5 sections từ portal/app
│   ├── sections/             # Shared sections (portal)
│   └── config.ts            # Dynamic config loader
├── public/
│   ├── zps/                 # ZPS images (team-member-*.jpg)
│   └── *.jpg                # Portal images
└── vite.config.ts           # Site-specific config
```

### Config properties

| Site | Base Path | Port | Theme |
|------|-----------|------|-------|
| portal | `/portal/` | 3000 | Đỏ |
| zps | `/` | 3002 | Hồng |

---

## ⚙️ Available Scripts

### Client
| Script | Mô tả |
|--------|--------|
| `npm run dev` | Dev portal (port 3000) |
| `npm run dev:portal` | Dev portal site |
| `npm run dev:zps` | Dev ZPS site |
| `npm run build` | Build portal |
| `npm run build:portal` | Build portal site |
| `npm run build:zps` | Build ZPS site |
| `npm run preview` | Preview production build |

### Server
| Script | Mô tả |
|--------|--------|
| `npm run start` | Start production |
| `npm run start:dev` | Start dev với hot reload |
| `npm run build` | Build server |

---

## 📝 Thêm Site mới

1. **Tạo thư mục:** `src/sites/new-site/`
2. **Tạo files:**
   - `config.ts` - Site content
   - `theme.css` - Site styles
   - `NewSiteApp.tsx` - React component
3. **Update vite.config.ts:**
   - Thêm port vào `sitePorts`
   - Thêm base path vào `siteBases`
4. **Update package.json:** Thêm script `dev:new-site` và `build:new-site`
5. **Update App.tsx:** Thêm conditional import cho site mới

---

## 🔧 Environment Variables

### Client (.env.portal)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SITE_ID=portal
```

### Client (.env.zps)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SITE_ID=zps
```
