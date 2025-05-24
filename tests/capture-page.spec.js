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

  test('login, navigate the capture page, check email, logout', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting capture page test')

    // Navigate to Capture page
    await clickNavButton(page, 'Capture')
    console.log('✅ Navigated to Capture page')

    // Verify that the displayed email matches TEST_USER environment variable
    console.log(`🔍 Checking displayed email matches TEST_USER: ${TEST_USER}`)
    
    // Wait for the email to actually load - wait for a span that contains the TEST_USER email
    console.log('⏳ Waiting for email to load in the user display...')
    
    // Wait for the email to appear by looking for the blue span containing the email
    const emailSpan = page.locator('p:has-text("Capture and manage your content") span.text-blue-600')
    await expect(emailSpan).toBeVisible({ timeout: 10000 })
    
    // Get the email text content
    const displayedEmail = await emailSpan.textContent()
    console.log(`📧 Found displayed email: ${displayedEmail}`)
    console.log(`📧 Expected email: ${TEST_USER}`)
    
    expect(displayedEmail.trim()).toBe(TEST_USER)
    console.log('✅ Email verification successful - displayed email matches TEST_USER')

    // Logout
    await logoutFromApplication(page)
    console.log('✅ Logged out successfully')
    console.log('✅ Capture page registration test completed successfully')
  });
}); 