import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  clickNavButton,
  logoutFromApplication
} from './utils'

let loggedBaseURL = false // Flag to ensure baseURL is logged only once
let basePath = ''
// Utility selectors
const selectors = {
  loginEmail: 'input[type="email"]',
  loginPassword: 'input[type="password"]',
  loginButton: 'button:has-text("Login")',
  captureNav: 'a:has-text("Capture")',
  registrationStatus: 'text=/The user .* is (now )?registered/',
  unregisterButton: 'button:has-text("Unregister the user")',
  unregisterModal: 'text=Confirm Unregister',
  cancelButton: 'button:has-text("Cancel")',
  logoutButton: 'button:has-text("Logout")',
}

test.describe('Capture Page Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      basePath = ''
      if (baseURL) {
        const url = new URL(baseURL)
        if (url.pathname !== '/') basePath = url.pathname
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using basePath: ${basePath}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
    // Go to login page and login
    await navigateToLogin(page, basePath)
    await loginToApplication(page, basePath)
  })

  test('register, open/cancel unregister, verify still registered, logout', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting capture page registration test')
    console.log('🔍 This test checks the registration flow, unregister modal, and registration status')

    // Navigate to Capture page
    await clickNavButton(page, 'Capture')
    console.log('✅ Navigated to Capture page')

    // Wait for registration status (either "is registered" or "is now registered")
    await page.waitForSelector(selectors.registrationStatus, { timeout: 10000 });
    const statusText = await page.textContent(selectors.registrationStatus);
    expect(statusText).toMatch(/The user .* is (now )?registered/);
    console.log('✅ Registration status verified:', statusText)

    // Open unregister modal
    await page.click(selectors.unregisterButton);
    await page.waitForSelector(selectors.unregisterModal);
    console.log('✅ Unregister modal opened')

    // Cancel unregister
    await page.click(selectors.cancelButton);
    console.log('✅ Cancelled unregister action')

    // Ensure still registered
    await page.waitForSelector(selectors.registrationStatus, { timeout: 5000 });
    const statusTextAfterCancel = await page.textContent(selectors.registrationStatus);
    expect(statusTextAfterCancel).toMatch(/The user .* is (now )?registered/);
    console.log('✅ Registration status after cancel verified:', statusTextAfterCancel)

    // Logout
    await logoutFromApplication(page)
    console.log('✅ Logged out successfully')
    console.log('✅ Capture page registration test completed successfully')
  });
}); 