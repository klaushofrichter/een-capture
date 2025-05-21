import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  clickNavButton,
  logoutFromApplication
} from './utils'

let basePath = ''

// Replace with your test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

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
    // Optionally set basePath if needed (see login-navigation.spec.js)
    const baseURL = page.context()._options.baseURL
    basePath = ''
    if (baseURL) {
      const url = new URL(baseURL)
      if (url.pathname !== '/') basePath = url.pathname
    }
    // Go to login page and login
    await navigateToLogin(page, basePath)
    await loginToApplication(page, basePath)
  })

  test('register, open/cancel unregister, verify still registered, logout', async ({ page }) => {
    // Navigate to Capture page
    await clickNavButton(page, 'Capture')

    // Wait for registration status (either "is registered" or "is now registered")
    await page.waitForSelector(selectors.registrationStatus, { timeout: 10000 });
    const statusText = await page.textContent(selectors.registrationStatus);
    expect(statusText).toMatch(/The user .* is (now )?registered/);

    // Open unregister modal
    await page.click(selectors.unregisterButton);
    await page.waitForSelector(selectors.unregisterModal);

    // Cancel unregister
    await page.click(selectors.cancelButton);

    // Ensure still registered
    await page.waitForSelector(selectors.registrationStatus, { timeout: 5000 });
    const statusTextAfterCancel = await page.textContent(selectors.registrationStatus);
    expect(statusTextAfterCancel).toMatch(/The user .* is (now )?registered/);

    // Logout
    await logoutFromApplication(page)
  });
}); 