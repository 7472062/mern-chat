import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://host.docker.internal:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'ws://host.docker.internal:5050',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://host.docker.internal:5050',
        changeOrigin: true,
      },
    },
  },
})
