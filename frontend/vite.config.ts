import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: false,
    watch: null,
    proxy: {
      '/api': {
        target: 'http://app:3000',
        changeOrigin: true,
      },
    },
  },
})
