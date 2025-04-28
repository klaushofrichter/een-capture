import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Keep false due to shared auth state potentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Keep workers at 1 due to auth tests potentially interfering
  reporter: 'html',
  use: {
    // baseURL is automatically handled by webServer, but can be a fallback
    baseURL: 'http://127.0.0.1:3333',
    trace: 'on-first-retry',
    video: 'on'
  },
  outputDir: './test-results/',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
    // Add other browsers if needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000 // Increased timeout for server start
  }
})
