import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    testTimeout: 60000, // Long timeout for server startup
    hookTimeout: 40000, // Long timeout for beforeAll/afterAll
    // No setup files - E2E tests manage their own server
  },
})
