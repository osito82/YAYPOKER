import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: ['osongo.duckdns.org', 'localhost', '127.0.0.1'],
    host: true,
    hmr: {
      host: 'osongo.duckdns.org',
      clientPort: 443,
    },
  },
})
