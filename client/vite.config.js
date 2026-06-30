import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const prerender = require('vite-plugin-prerender')
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // Pre‑render the most important routes for SEO
    prerender({
      staticDir: resolve(__dirname, 'dist'),
      // List every route you want Google to see without JS
      routes: [
        '/',
        '/privacy',
        '/terms',
        // Add more static pages as needed
      ],
    }),
  ],
  server: {
    allowedHosts: ['osongo.duckdns.org', 'localhost', '127.0.0.1'],
    host: true,
    hmr: {
      host: 'osongo.duckdns.org',
      clientPort: 443,
    },
  },
})
