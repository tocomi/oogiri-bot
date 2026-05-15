import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['lib/**', 'node_modules/**'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
