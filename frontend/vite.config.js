import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:9900',
        ws: true
      }
    }
  }
})

//new WebSocket('ws://localhost:5173/ws')
