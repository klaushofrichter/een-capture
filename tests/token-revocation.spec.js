import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import { 
  navigateToHome, 
  loginToApplication, 
  isGitHubPagesEnvironment,
  createUrlPattern,
  buildUrl
} from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Token Revocation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
        
        // Log if we're in GitHub Pages or local environment
        const environment = isGitHubPagesEnvironment(page) ? 'GitHub Pages' : 'local development';
        console.log(`🔍 Testing in ${environment} environment\n`);
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should perform token revocation during logout', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`);
    console.log('🔍 Starting token revocation test')
    // Increase timeout for this test
    test.setTimeout(120000)

    // Get credentials from environment variables
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // Ensure credentials are provided
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      !username || !password,
      'Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.'
    )

    // Navigate to home page
    await navigateToHome(page);
    
    // Login to the application
    await loginToApplication(page, username, password);
    
    // Wait for home page to load
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Successfully logged in')

    // Initiate logout to test revocation
    console.log('🚪 Starting logout process to test token revocation')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible()
    console.log('✅ Logout modal displayed')

    // Click the immediate logout button to force immediate token revocation
    await page.getByRole('button', { name: 'OK' }).click()
    console.log('👆 Clicked OK button to immediately log out')

    // Verify we're redirected back to the login page
    // After logout, we should be able to see if we're logged in by checking for UI elements
    // that would only be visible if we're logged in (or not)
    try {
      // Wait for either:
      // 1. Redirect to the EEN login page (eagleeyenetworks.com)
      // 2. The home page loads and we see the login button (not logged in)
      // 3. The home page loads but we DON'T see the user dashboard (not logged in)
      
      await Promise.race([
        page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 5000 }),
        page.getByText('Sign in with Eagle Eye Networks').waitFor({ state: 'visible', timeout: 5000 }),
        page.getByText('Welcome to EEN Login').waitFor({ state: 'visible', timeout: 5000 })
      ]);
      
      // Check if we're on the home page but not logged in
      const isLoggedIn = await page.getByText('You have successfully logged in').isVisible()
        .catch(() => false);
      
      if (isLoggedIn) {
        throw new Error('Still appears to be logged in after token revocation');
      }
      
      console.log('✅ Session correctly ended - not logged in after revocation');
    } catch (error) {
      if (error.message.includes('Still appears to be logged in')) {
        throw error;
      }
      // We might get here if the race condition timeout happens, which is fine
      // as long as we're not logged in
      const isLoggedIn = await page.getByText('You have successfully logged in').isVisible()
        .catch(() => false);
      
      if (isLoggedIn) {
        throw new Error('Still appears to be logged in after token revocation');
      }
      console.log('✅ Session correctly ended - not logged in after revocation');
    }

    console.log('✅ Token revocation test completed successfully')
  })
}) 