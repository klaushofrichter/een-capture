import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Invalid Route Navigation', () => {
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

  test('should display not found page after login when navigating to invalid route', async ({ page }) => {
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
    await page.goto(invalidRoute)

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

    // After successful login, we should be redirected to the original invalid route
    // and shown the NotFound page
    await page.waitForURL(new RegExp(`.*${invalidRoute}$`), { timeout: 15000 })
    
    // Verify we're on the NotFound page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`The page ${invalidRoute} does not exist.`)).toBeVisible()
    
    // Verify navigation buttons are present
    await expect(page.getByText('Go to Home')).toBeVisible()
    
    // Navigate to home by clicking the button
    await page.getByText('Go to Home').click()
    
    // Verify we're now on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
  })
}) 