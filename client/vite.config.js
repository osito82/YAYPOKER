import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: true,
    host: true, // Necessary to expose the server to the network
    watch: {
      usePolling: true,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/.vscode/**',
      ],
    },
  },
})
