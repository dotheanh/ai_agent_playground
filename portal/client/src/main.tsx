import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Load only the active site's theme CSS (non-eager to avoid loading all themes)
const siteId = import.meta.env.VITE_SITE_ID || 'portal'
const themeLoaders = import.meta.glob('./sites/*/theme.css')
const themePath = `./sites/${siteId}/theme.css`

if (themeLoaders[themePath]) {
  themeLoaders[themePath]()
} else {
  console.warn(`[Multi-site] Theme not found for "${siteId}"`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
