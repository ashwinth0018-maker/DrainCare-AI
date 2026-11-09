import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/sensors': 'http://127.0.0.1:8000',
      '/alerts': 'http://127.0.0.1:8000',
      '/ai': 'http://127.0.0.1:8000',
      '/bookings': 'http://127.0.0.1:8000',
      '/payment': 'http://127.0.0.1:8000',
    },
  },
})
