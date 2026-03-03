import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    silent: false,
    reporters: 'verbose',
    exclude: ['node_modules/**', 'dist/**', 'logs/**'],
  },
})