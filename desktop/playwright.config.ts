import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 20000, // 20 seconds for server startup
  workers: 1, // Electron tests can't parallelize well
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
});
