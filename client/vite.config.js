import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Build-time prerender bundle (OPS-003): inline every dependency so Node never resolves
  // browser-only packages (e.g. qrcode-vue3) on its own.
  ssr: { noExternal: true },
  server: {
    allowedHosts: ['osongo.duckdns.org', 'localhost', '127.0.0.1'],
    host: true,
    hmr: {
      host: 'osongo.duckdns.org',
      clientPort: 443,
    },
  },
})
