import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  // Get site ID from env
  const siteId = env.VITE_SITE_ID || 'portal'

  // Site-specific port mapping
  const sitePorts: Record<string, number> = {
    portal: 3000,
    zps: 3002,
  }

  // Site-specific base path (where the site is served from)
  const siteBases: Record<string, string> = {
    portal: '/portal/',
    zps: '/',
  }

  const port = sitePorts[siteId] || 3000
  const base = siteBases[siteId] || '/'

  console.log(`[Vite] Building site: ${siteId}, port: ${port}`)

  return {
    base,
    plugins: [inspectAttr(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port,
      host: true,
    },
    define: {
      'import.meta.env.VITE_SITE_ID': JSON.stringify(siteId),
    },
  }
})
