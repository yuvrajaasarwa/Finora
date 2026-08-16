// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Test Configuration for Finora
 * Targets live deployment: https://finora-qzdk.onrender.com
 * Override via environment variable: PLAYWRIGHT_BASE_URL
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Sequential execution to prevent test data race conditions
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],
  outputDir: 'test-results',
  timeout: 45000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://finora-qzdk.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Mobile Chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
