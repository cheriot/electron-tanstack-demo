import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

process.env.GOOGLE_API_KEY = 'nevercallapisfromtests'
process.env.EXA_API_KEY = process.env.GOOGLE_API_KEY
process.env.AI_GATEWAY_API_KEY = process.env.EXA_API_KEY

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    exclude: ['node_modules', 'dist', 'tests/test-dbs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', 'tests/**'],
    },
    // Increase timeout for database operations
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
