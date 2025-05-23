import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  clickNavButton,
  logoutFromApplication
} from './utils'
import dotenv from 'dotenv'; // Import dotenv
import fs from 'fs'; // Import fs for file operations
import path from 'path'; // Import path for path manipulation

dotenv.config(); // Load environment variables from .env file

let loggedBaseURL = false // Flag to ensure baseURL is logged only once
let basePath = ''
let consoleLogs = []; // Array to store console logs for each test

// this is used to confirm the user that is logged in
const TEST_USER = process.env.TEST_USER|| 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword'; // Keep password for login utility

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
  userEmailField: '#user-email', // Added selector for user email field
}

test.describe('Capture Page Registration Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Clear logs and set up listener for each test
    consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

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

  test.afterEach(async ({}, testInfo) => {
    // Save console logs to a file after each test
    // const logFileName = `${testInfo.title.replace(/\s+/g, '-').toLowerCase()}-browser-console.log`;
    const logFileName = `browser-console.log`;
    const logFilePath = path.join(testInfo.outputDir, logFileName);
    const logDir = path.dirname(logFilePath); // Get the directory path

    // Create the directory if it doesn't exist
    fs.mkdirSync(logDir, { recursive: true });

    fs.writeFileSync(logFilePath, consoleLogs.join('\n'));
    console.log(`📚 Browser console logs saved to: ${logFilePath}`);
  });

  test('register, open/cancel unregister, verify still registered, logout', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting capture page registration test')
    console.log('🔍 This test checks the registration flow, unregister modal, and registration status')

    // Navigate to Profile page first to ensure user profile is loaded
    await clickNavButton(page, 'Profile');
    console.log('✅ Navigated to Profile page');
    // Wait for the user email field to have the correct text content
    const userEmailLocator = page.locator(selectors.userEmailField);
    await expect(userEmailLocator).toHaveText(TEST_USER); // Wait for correct email text
    console.log(`✅ User email field contains the correct email: ${TEST_USER}`);

    // Navigate to Capture page
    await clickNavButton(page, 'Capture')
    console.log('✅ Navigated to Capture page')

    // wait for the application to detect authenticated user on Capture page
    await page.waitForEvent('console', msg => msg.text().includes('Authenticated user detected, fetching data...'));
    console.log('✅ Application detected authenticated user on Capture page');

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