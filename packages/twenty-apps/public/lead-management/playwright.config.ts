import * as path from 'path';

import { defineConfig, devices } from '@playwright/test';

// Screenshot capture against a live Twenty instance (the CI screenshots
// job spawns twenty-app-dev, which serves the real frontend). Only the
// setup + chromium projects are needed — this is not a cross-browser
// test suite, it produces the marketplace gallery images in public/.

process.env.TZ = 'Europe/Paris';

const FRONT_BASE_URL = process.env.FRONT_BASE_URL ?? 'http://localhost:2021';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120 * 1000,
  globalSetup: './e2e/global-setup.ts',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: FRONT_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    testIdAttribute: 'data-testid',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1600, height: 1000 },
  },
  expect: {
    timeout: 15_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
        storageState: path.resolve(__dirname, 'e2e/.auth/user.json'),
      },
      dependencies: ['setup'],
    },
  ],
});
