import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendURL = process.env.BACKENDURL_URL || 'HTTP://localhost:9900'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: backendURL.replace(/^http/,'ws'),
        ws: true
      }
    }
  }
})

//new WebSocket('ws://localhost:5173/ws')
