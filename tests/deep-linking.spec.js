import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should redirect to settings page after login when deep linking', async ({ page }) => {
    console.log('🔍 Starting deep linking test')
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

    console.log('🌐 Navigating to Settings page while not logged in')
    // Navigate directly to the settings page while not logged in
    await page.goto('/settings')

    // Since we're not authenticated, we should be redirected to login
    // Wait for the EEN login page after redirect
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })
    console.log('✅ Redirected to EEN login page as expected')

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

    // After successful login, we should be redirected to the settings page
    await page.waitForURL(/.*\/settings$/, { timeout: 15000 })
    console.log('✅ Redirected to Settings page after login - deep linking successful!')

    // Verify we're on the Settings page
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()

    // Test theme switching functionality to confirm we're on a fully functional settings page
    console.log('🎨 Testing theme switching')
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Navigate to an invalid route
    const invalidRoute = '/ABCDEFG'
    console.log(`🚫 Navigating to invalid route: ${invalidRoute}`)
    await page.goto(invalidRoute)

    // Verify we're on the NotFound page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`The page ${invalidRoute} does not exist.`)).toBeVisible()
    console.log('✅ NotFound page displayed correctly')

    // Check for the "Go Back to Previous Page" button and click it
    const backButton = page.getByText('Go Back to Previous Page')
    await expect(backButton).toBeVisible()
    console.log('⬅️ Clicking Go Back to Previous Page button')
    await backButton.click()

    // Verify we're back on the Settings page
    await page.waitForURL(/.*\/settings$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    console.log('✅ Successfully returned to Settings page')

    // Logout to end the test
    console.log('🚪 Starting logout process')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible()
    console.log('⏳ Waiting for automatic logout (8 seconds)')

    // Wait for the logout to complete automatically by checking URL
    await expect(page).toHaveURL('/', { timeout: 15000 })

    // Verify we're back on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
    console.log('✅ Logout successful, test complete')
  })
})
