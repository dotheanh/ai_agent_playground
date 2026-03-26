import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/renderer',
  base: './',
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: '../../dist-renderer',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
