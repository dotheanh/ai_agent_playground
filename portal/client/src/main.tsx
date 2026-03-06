import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Eagerly load all site theme CSS at build time (Vite tree-shakes unused)
const themeModules = import.meta.glob('./sites/*/theme.css', { eager: true })
const siteId = import.meta.env.VITE_SITE_ID || 'portal'
const themePath = `./sites/${siteId}/theme.css`

if (!themeModules[themePath]) {
  console.warn(`[Multi-site] Theme not found for site "${siteId}", using fallback`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
