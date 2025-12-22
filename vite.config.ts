import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    proxy: {
      '/api/bing': {
        target: 'https://www.bing.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bing/, ''),
        secure: true,
      },
      '/api/google': {
        target: 'https://www.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        secure: true,
      },
    },
  },
})
