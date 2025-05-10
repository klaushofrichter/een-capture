import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import { isGitHubPagesEnvironment } from './utils.js'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Invalid Route Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should display not found page after login when navigating to invalid route', async ({
    page
  }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`);
    console.log('🔍 Starting invalid route test');
    
    // Skip test in GitHub Pages environment
    if (isGitHubPagesEnvironment(page)) {
      console.log('⏭️ Skipping invalid route test in GitHub Pages environment');
      test.skip(true, 'This test is not applicable to GitHub Pages without proper 404.html configuration');
      return;
    }
    
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

    // Navigate to an invalid route
    const invalidRoute = '/abcdefg'
    console.log(`🚫 Navigating to invalid route: ${invalidRoute}`)
    await page.goto(invalidRoute)

    // Since we're not authenticated, we should be redirected to login
    // Wait for the EEN login page after redirect
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })
    console.log('✅ Redirected to login page as expected')

    // Wait for email field and fill
    const emailInput = page.locator('#authentication--input__email')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    console.log('👤 Filling email field')
    await emailInput.fill(username)

    // Find and click the next button
    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    console.log('➡️ Clicked Next button')

    // Wait for password field and fill
    const passwordInput = page.locator('#authentication--input__password')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    console.log('🔑 Filling password field')
    await passwordInput.fill(password)

    // Click the sign in button
    const signInButton = page.locator('#next')
    const signInButtonByText = page.getByRole('button', { name: 'Sign in' })
    await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 })

    console.log('🔐 Clicking Sign in button')
    try {
      await signInButton.click()
      console.log('➡️ Clicked sign in button by ID')
    } catch (error) {
      console.log('Could not find sign in button by ID, trying by text')
      await signInButtonByText.click()
    }

    // After successful login, we should be redirected to the original invalid route
    // and shown the NotFound page
    await page.waitForURL(new RegExp(`.*${invalidRoute}$`), { timeout: 15000 })
    console.log('✅ Redirected to invalid route after login')

    // Verify we're on the NotFound page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`The page ${invalidRoute} does not exist.`)).toBeVisible()
    console.log('✅ NotFound page displayed correctly')

    // Verify the "Go Back to Previous Page" button is NOT present
    await expect(page.getByText(/Go Back to/)).toBeHidden()
    console.log('✅ "Go Back to Previous Page" button is correctly hidden')

    // Verify navigation buttons are present
    await expect(page.getByText('Go to Home')).toBeVisible()

    // Navigate to home by clicking the button
    console.log('🏠 Clicking Go to Home button')
    await page.getByText('Go to Home').click()

    // Verify we're now on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    console.log('✅ Navigated to Home page successfully')
    console.log('✅ Invalid route test completed successfully')
  })
})
