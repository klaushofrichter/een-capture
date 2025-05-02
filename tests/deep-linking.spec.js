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

    // Navigate directly to the settings page while not logged in
    await page.goto('/settings')

    // Since we're not authenticated, we should be redirected to login
    // Wait for the EEN login page after redirect
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })

    // Wait for email field and fill
    const emailInput = page.locator('#authentication--input__email')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await emailInput.fill(username)

    // Find and click the next button
    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    
    // Wait for password field and fill
    const passwordInput = page.locator('#authentication--input__password')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await passwordInput.fill(password)

    // Click the sign in button
    const signInButton = page.locator('#next')
    const signInButtonByText = page.getByRole('button', { name: 'Sign in' })
    await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 })
    
    try {
      await signInButton.click()
    } catch (error) {
      await signInButtonByText.click()
    }

    // After successful login, we should be redirected to the settings page
    await page.waitForURL(/.*\/settings$/, { timeout: 15000 })
    
    // Verify we're on the Settings page
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
    
    // Test theme switching functionality to confirm we're on a fully functional settings page
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    
    // Navigate to an invalid route
    const invalidRoute = '/ABCDEFG'
    await page.goto(invalidRoute)
    
    // Verify we're on the NotFound page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`The page ${invalidRoute} does not exist.`)).toBeVisible()
    
    // Check for the "Go Back to Previous Page" button and click it
    const backButton = page.getByText('Go Back to Previous Page')
    await expect(backButton).toBeVisible()
    await backButton.click()
    
    // Verify we're back on the Settings page
    await page.waitForURL(/.*\/settings$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    
    // Logout to end the test
    await page.getByRole('button', { name: 'Logout' }).click()
    
    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible()
    
    // Wait for the logout to complete automatically by checking URL
    await expect(page).toHaveURL('/', { timeout: 15000 })
    
    // Verify we're back on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
  })
}) 