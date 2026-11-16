import { defineConfig } from '@playwright/test'
import { WEBKIT_DEVICES, CHROMIUM_DEVICES } from './tests/e2e/devices.mjs'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  workers: 2,
  // Absorbs browser-scheduler flakes (WebKit on the largest viewports races
  // the 3.5s overlay budget under parallel CPU contention); assertions are
  // unchanged — a retry still has to pass the same checks.
  retries: process.env.CI ? 2 : 1,
  reporter: [['list']],
  use: { baseURL: process.env.PREVIEW_URL || 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: 'yarn preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 120000,
      },
  projects: [
    ...Object.entries(WEBKIT_DEVICES).map(([name, use]) => ({
      name,
      use,
      testMatch: 'ios-webkit.spec.ts',
    })),
    ...Object.entries(CHROMIUM_DEVICES).map(([name, use]) => ({
      name,
      use,
      testMatch: 'android-chromium.spec.ts',
    })),
  ],
})
