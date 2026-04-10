# Deployment Guide

## 📋 Overview

This guide covers building, testing, and deploying the Phú Quốc Trip Guidebook application to production.

**Quick Summary:**
- Build: `npm run build` → `/dist` folder
- Test: `npm run preview` → Local production preview
- Deploy: Push `/dist` to hosting service (Vercel, Netlify, GitHub Pages)

---

## 🔨 Building for Production

### Prerequisites

```bash
# Verify Node.js version (v16+ required, recommend v18+)
node --version    # Should be v16 or higher

# Verify npm
npm --version
```

### Build Command

```bash
# Clean build
npm run build

# Expected output:
# ✓ 1425 modules transformed
# dist/index.html                 2.45 kB │ gzip:   1.23 kB
# dist/assets/index-ABC123.js   226 kB │ gzip:    70 kB
# dist/assets/index-DEF456.css   97 kB │ gzip:    17 kB
# ✓ built in 6.78s
```

### Build Output Structure

```
dist/
├── index.html              # Main entry point
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript
│   ├── index-[hash].css    # Bundled CSS
│   └── [other-assets]
├── images/                 # Static images
│   ├── phuquoc-beach.jpg
│   └── ... (event images)
└── events-data.json        # Event data file
```

### Troubleshooting Builds

**Error: "TypeScript compilation failed"**
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Review and fix errors before building
npm run build
```

**Error: "Missing module"**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Then rebuild
npm run build
```

**Build is slow**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

---

## ✅ Testing Before Deployment

### Preview Production Build Locally

```bash
# Start preview server (uses dist/ folder)
npm run preview

# Opens at http://localhost:4173
# Test all features before deploying
```

### Manual Testing Checklist

**Desktop (Chrome/Firefox):**
- [ ] Page loads without errors (check console)
- [ ] Timeline displays all 24 events
- [ ] DetailPanel shows event details
- [ ] Image carousel works (prev/next, dots)
- [ ] External links open correctly
- [ ] Current event is highlighted
- [ ] Past events are dimmed
- [ ] Time updates every 60 seconds

**Mobile (iPhone Safari/Chrome):**
- [ ] Layout responsive (portrait + landscape)
- [ ] Touch targets ≥ 44px (no tiny buttons)
- [ ] Image indicators clear and usable
- [ ] Tab navigation works (Timeline/Detail swap)
- [ ] "Next Event" button functional
- [ ] Scroll smooth and responsive
- [ ] No horizontal scroll overflow

**Lighthouse Audit:**
```bash
# Run Lighthouse in DevTools (Chrome)
# Cmd+Shift+P → "Lighthouse: Generate report"

Target scores:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 90
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Prerequisites:**
- GitHub account with repo
- Vercel account (free tier available)

**Steps:**

1. **Prepare GitHub repository**
   ```bash
   # Initialize git (if not already)
   git init
   git add .
   git commit -m "initial: phuquoc guidebook app"
   git branch -M main
   git remote add origin https://github.com/yourusername/pq_guidebook.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up / Log in
   - Click "Add New..." → "Project"
   - Import Git repository
   - Select repository: `pq_guidebook`

3. **Configure Build**
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Click "Deploy"

4. **Custom Domain (Optional)**
   - Go to project settings
   - Add custom domain
   - Update DNS records as instructed

**Automatic Deployments:**
Every push to `main` branch automatically deploys to production.

### Option 2: Netlify

**Prerequisites:**
- GitHub account with repo
- Netlify account (free tier available)

**Steps:**

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Sign up / Log in
   - Click "Add new site" → "Connect to Git"
   - Select GitHub and authorize
   - Choose repository

2. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 (set in `.nvmrc`)
   - Click "Deploy site"

3. **Site Settings**
   - Navigate to site settings
   - Add custom domain if desired
   - Configure redirects (see below)

**Netlify Configuration File:**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[dev]
  command = "npm run dev"
  port = 5173

# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: GitHub Pages

**Limitations:**
- Only supports static files in public subdomain
- Requires repo name in URL (unless custom domain)
- No server-side features

**Steps:**

1. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/<REPO_NAME>/',  // if using project site
     // base: '/',            // if using custom domain
     plugins: [react()],
   })
   ```

2. **Rebuild**
   ```bash
   npm run build
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "chore: update vite config for github pages"
   git push origin main
   ```

4. **Enable GitHub Pages**
   - Go to repo → Settings → Pages
   - **Source**: Deploy from branch
   - **Branch**: main
   - **Folder**: `/` (or `/docs` if you store dist there)
   - Save

5. **Wait for deployment**
   - GitHub Actions automatically builds and deploys
   - Check "Actions" tab for build status
   - Site available at `https://username.github.io/pq_guidebook`

---

## 🔐 Environment & Security

### Environment Variables

**For API keys or secrets:**

1. **Create `.env.local` (development only)**
   ```
   VITE_API_URL=https://api.example.com
   VITE_API_KEY=your_key_here
   ```

2. **Update `.gitignore`**
   ```
   # Environment
   .env.local
   .env.*.local
   ```

3. **Access in code**
   ```typescript
   const apiUrl = import.meta.env.VITE_API_URL;
   ```

4. **For deployment**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site settings → Build & Deploy → Environment
   - Add variables and redeploy

### Current Project Status

**No sensitive data** - This project uses static JSON data, no API keys or secrets needed. All events are in `public/events-data.json`.

---

## 📊 Monitoring Deployment

### Vercel Monitoring

1. **Analytics**
   - Go to project → Analytics
   - View page views, response times, etc.

2. **Logs**
   - Project → Deployments → Select deployment
   - View build and deployment logs

3. **Rollback**
   - Deployments tab
   - Click previous deployment
   - "Redeploy" to rollback

### Netlify Monitoring

1. **Deploys**
   - Site → Deploys tab
   - View all deployments and status

2. **Logs**
   - Select deployment → "Deploy log" tab
   - View build output

3. **Deployment Preview**
   - Each deployment gets unique preview URL
   - Test before promoting to main

---

## 🔄 Updating After Deployment

### Minor Content Updates (Event Data)

1. **Update event data**
   ```bash
   # Edit public/events-data.json with new event info
   ```

2. **Build and commit**
   ```bash
   npm run build
   git add .
   git commit -m "update: add new events to guidebook"
   git push origin main
   ```

3. **Auto-deployment**
   - Vercel/Netlify automatically redeploy
   - Update live in 1-2 minutes

### Major Feature Updates

1. **Develop locally**
   ```bash
   npm run dev
   # Test extensively
   ```

2. **Build and test**
   ```bash
   npm run build
   npm run preview
   # Test production build locally
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

4. **Monitor deployment**
   - Vercel/Netlify will build automatically
   - Check for build errors in deployment logs

---

## 🐛 Troubleshooting Deployments

### Build Fails on Vercel/Netlify

1. **Check build logs**
   - Vercel: Deployments → Failed → "View details"
   - Netlify: Deploys → Failed → "View deploys log"

2. **Common issues**
   - Missing dependencies: Run `npm install` locally and commit `package-lock.json`
   - TypeScript errors: Run `npx tsc --noEmit` locally and fix
   - Node version mismatch: Specify in `.nvmrc` file

3. **Force rebuild**
   ```bash
   # Push small commit to trigger rebuild
   git commit --allow-empty -m "chore: trigger rebuild"
   git push
   ```

### Blank Page After Deployment

1. **Check browser console** (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Common causes**
   - Wrong base path (GitHub Pages issue)
   - Missing public assets
   - Service worker conflicts

3. **Verify dist/ folder**
   ```bash
   # Check if dist is correctly built
   npx http-server dist
   # Visit http://localhost:8080 locally
   ```

### Slow Performance

1. **Run Lighthouse**
   - DevTools → Lighthouse → Analyze
   - Check for bottlenecks

2. **Check file sizes**
   ```bash
   npm run build
   # Review dist/assets/ file sizes
   ```

3. **Enable caching**
   - Vercel/Netlify automatically cache assets
   - Verify cache headers in response headers

### Images Not Loading

1. **Check public folder**
   - Verify images exist in `public/images/`
   - Verify paths in `events-data.json` are correct
   - Use relative paths: `/images/filename.jpg` not `./images/filename.jpg`

2. **Test locally**
   ```bash
   npm run build
   npm run preview
   # Verify images load at http://localhost:4173
   ```

---

## 🎯 Performance Optimization

### Production Build Metrics

**Current (Reference):**
- JavaScript: 226 kB (70 kB gzipped)
- CSS: 97 kB (17 kB gzipped)
- Total: 323 kB (87 kB gzipped)
- Build time: ~6-7 seconds

### Optimization Opportunities

1. **Image Optimization**
   - Convert JPG → WebP for smaller file size
   - Use responsive images with srcset
   - Lazy load below-the-fold images

2. **Code Splitting**
   - Already optimized by Vite
   - Route-based chunking available if adding routing

3. **Tree Shaking**
   - Remove unused code from dependencies
   - Check Vite analyze plugin for details

4. **Caching Strategy**
   - Set immutable cache headers for `/assets/*`
   - Use version hashes (already done by Vite)

---

## 📱 Mobile Deployment Considerations

### Web App Installation

Add PWA support for app-like experience:

**Create `public/manifest.json`:**
```json
{
  "name": "Phú Quốc Trip Guidebook",
  "short_name": "PQ Guidebook",
  "description": "Interactive trip guidebook for Phú Quốc",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0891b2",
  "icons": [
    {
      "src": "/pq-icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pq-icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Add to `index.html`:**
```html
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/pq-icon-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#0891b2">
```

---

## ✅ Pre-Deployment Checklist

Before pushing to production:

- [ ] `npm run build` completes without errors
- [ ] `npm run preview` works locally
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] All responsive layouts tested (mobile, tablet, desktop)
- [ ] Touch targets ≥ 44px verified
- [ ] All images load correctly
- [ ] External links work
- [ ] Current event detection working
- [ ] Timeline auto-scroll functional
- [ ] Console clean (no errors/warnings)
- [ ] SEO meta tags up to date
- [ ] `package-lock.json` committed
- [ ] `.env.local` in `.gitignore`
- [ ] Build times acceptable (< 10 seconds)

---

## 🔗 Useful Resources

**Hosting Comparison:**
| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| **Free tier** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto-deploy** | ✅ Git push | ✅ Git push | ✅ Git push |
| **Custom domain** | ✅ Free | ✅ Free | ✅ Free |
| **Environment vars** | ✅ Yes | ✅ Yes | ❌ No |
| **Redirects** | ✅ Automatic | ✅ Auto + config | ✅ Needs config |
| **Build speed** | ⚡ Fast | ⚡ Fast | Fast |
| **Ease of setup** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

**Documentation Links:**
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Vite Deployment Docs](https://vitejs.dev/guide/static-deploy.html)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 📞 Support & Debugging

### Build Fails Locally

1. **Clear cache and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node version**
   ```bash
   node --version  # Should be v16+
   npm --version   # Should be v8+
   ```

3. **Verbose output**
   ```bash
   npm run build -- --debug
   ```

### Performance Issues

1. **Analyze bundle**
   ```bash
   npm install -D rollup-plugin-visualizer
   # See vite.config.ts for usage
   ```

2. **Check time logic**
   - Time detection calculated every 60 seconds
   - Minimal DOM updates on time changes
   - See TIME_LOGIC.md for optimization tips

### Common Questions

**Q: How often is the deployment updated?**
A: Vercel/Netlify auto-deploy on every push to main branch (usually < 2 minutes)

**Q: Can I preview before deploying?**
A: Yes - Netlify creates preview URLs for pull requests automatically

**Q: How do I rollback to previous version?**
A: Vercel/Netlify both allow one-click rollback to previous deployment

**Q: Can I use a custom domain?**
A: Yes - All platforms support custom domains (free for Vercel/Netlify)

---

## 🔗 Related Documents

- [README.md](./README.md) - Quick start guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Code quality
