import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose on all network interfaces (0.0.0.0)
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/assets': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
