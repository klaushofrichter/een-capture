import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Login and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
    // Go to the login page before each test
    await page.goto('/')
  })

  test('should login successfully and navigate through pages', async ({ page }) => {
    console.log('🔍 Starting login and navigation test')
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

    console.log('🚀 Starting login process')
    // Click the login button
    await page.getByText('Sign in with Eagle Eye Networks').click()

    // Wait for redirect to EEN login page
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })
    console.log('✅ Redirected to EEN login page')

    // Wait for the email field to be visible and ready
    const emailInput = page.locator('#authentication--input__email')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await expect(emailInput).toBeEnabled()

    console.log('👤 Attempting to fill email field...')
    await emailInput.fill(username)
    console.log('✅ Email field filled successfully')

    // Find and click the next button, wait for it to be enabled
    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    console.log('➡️ Next button clicked')

    // Wait for password field to appear and be ready
    const passwordInput = page.locator('#authentication--input__password')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeEnabled()

    console.log('🔑 Attempting to fill password field...')
    await passwordInput.fill(password)
    console.log('✅ Password field filled successfully')

    // Wait for the sign in button to be ready
    const signInButton = page.locator('#next') // Assuming #next is the primary sign in button
    const signInButtonByText = page.getByRole('button', { name: 'Sign in' })
    await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 })

    // Find and click the sign in button
    console.log('🔐 Attempting to click sign in button...')
    try {
      await signInButton.click()
      console.log('✅ Clicked sign in button by ID')
    } catch (error) {
      console.log('⚠️ Could not find sign in button by ID, trying text...')
      await signInButtonByText.click()
      console.log('✅ Clicked sign in button by text')
    }

    console.log('✅ Sign in button clicked successfully')

    // Wait for redirect back to our app and verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    // Wait for navigation links to be present as a sign of page load completion
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Profile' })).toBeVisible()
    console.log('✅ Home page loaded successfully')

    // Test navigation to different pages
    console.log('👤 Navigating to Profile page')
    await page.getByRole('navigation').getByRole('link', { name: 'Profile' }).click()
    await page.waitForURL(/.*\/profile$/, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Show & Copy' })).toBeVisible() // Wait for element specific to profile page
    console.log('✅ Profile page loaded successfully')

    // Show the initial token first
    console.log('🔑 Showing initial token')
    await page.getByRole('button', { name: 'Show & Copy' }).click()
    const tokenInput = page.locator('input[type="text"]')
    await expect(tokenInput).toBeVisible()
    await expect(tokenInput).toBeEnabled()

    // Capture token expiration text
    console.log('⏰ Capturing token expiration text')
    const tokenExpirationInput = page.locator(
      'div.mt-4:has(label:has-text("Token Expiration")) input'
    )
    await expect(tokenExpirationInput).toBeVisible()
    await expect(tokenExpirationInput).toBeEnabled()

    // Capture the access token - now it should be visible as text
    const firstAccessToken = await tokenInput.getAttribute('value')
    console.log('✅ Current access token captured')

    // Capture the base URL using the proper selector
    const baseUrl = await page.locator('label:has-text("Base URL")').evaluate(label => {
      return label.nextElementSibling.value
    })
    console.log('✅ Base URL captured')

    // Capture the port using the proper selector
    const port = await page.locator('label:has-text("Port")').evaluate(label => {
      return label.nextElementSibling.value
    })
    console.log('✅ Port captured')

    // Click the Refresh button if available
    console.log('🔄 Attempting to refresh token')
    const refreshButton = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // Wait for the refresh to complete
    await expect(page.getByText('Refreshing...')).toBeVisible()
    await expect(page.getByText('Refreshing...')).toBeHidden({ timeout: 10000 })
    console.log('✅ Token refreshed successfully')

    // click the show button again to reveal the new token
    // Wait for the button to potentially change from 'Hide' back to 'Show & Copy' and be stable
    const showCopyButton = page.getByRole('button', { name: 'Show & Copy' })
    await expect(showCopyButton).toBeVisible({ timeout: 5000 })
    await expect(showCopyButton).toBeEnabled({ timeout: 5000 })
    await showCopyButton.click()

    await expect(tokenInput).toBeVisible()
    await expect(tokenInput).toBeEnabled()

    // Use expect().toHaveValue() for better assertion that it's populated
    await expect(tokenInput).toHaveValue(/[\s\S]+/); // Regex checks for any non-empty string
    // Capture the value for comparison later
    const newAccessToken = await tokenInput.inputValue();

    console.log('✅ New access token captured')

    // compare the access token with the first access token
    expect(newAccessToken).not.toBe(firstAccessToken)
    console.log('✅ Access token is different from the first access token')

    console.log('ℹ️ Navigating to About page')
    await page.getByRole('navigation').getByRole('link', { name: 'About' }).click()
    await page.waitForURL(/.*\/about$/, { timeout: 10000 })
    await expect(page.getByText('About EEN Login')).toBeVisible()
    await expect(page.getByText('Features')).toBeVisible() // Wait for element specific to about page
    console.log('✅ About page loaded successfully')

    console.log('⚙️ Navigating to Settings page')
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.waitForURL(/.*\/settings$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible() // Wait for element specific to settings page

    // Test theme switching in settings
    console.log('🎨 Testing theme switching')
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    console.log('✅ Theme switching works correctly')

    // Test logout - first with cancel
    console.log('🚪 Testing logout with cancel')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown by waiting for specific elements
    await expect(page.getByText('Goodbye!')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Cancel Logout' })).toBeEnabled()

    // Click the cancel button
    await page.getByRole('button', { name: 'Cancel Logout' }).click()

    // Verify modal is gone
    await expect(page.getByText('Goodbye!')).toBeHidden()
    console.log('✅ Cancel logout successful')

    // Verify we're still on the settings page
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Now test logout with completion
    console.log('🚪 Performing full logout - this will take at least 8 seconds')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown again
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible()

    // Wait for the logout to complete automatically by checking URL
    await expect(page).toHaveURL('/', { timeout: 15000 })

    // Verify we're back on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
    console.log('✅ Automatic logout completed successfully')

    // Now test direct access with the captured credentials
    console.log('🔑 Testing Direct Access with captured credentials')

    // Navigate to the direct access page
    await page.goto('/direct')
    await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()

    // Fill in the captured credentials
    await page.getByLabel('Access Token').fill(newAccessToken)
    await page.getByLabel('Base URL').fill(baseUrl)
    await page.getByLabel('Port').fill(port)

    // Click the Proceed button
    await page.getByRole('button', { name: 'Proceed' }).click()
    console.log('➡️ Clicked Proceed button')

    // Verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    console.log('✅ Direct access login successful')

    // Navigate to Profile page and verify Refresh button state
    console.log('👤 Navigating to Profile page after direct login')
    await page.getByRole('navigation').getByRole('link', { name: 'Profile' }).click()
    await page.waitForURL(/.*\/profile$/, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible()

    // Verify Refresh button is disabled (since we don't have a refresh token in direct login)
    const refreshButtonAfterDirectLogin = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshButtonAfterDirectLogin).toBeHidden()
    console.log('✅ Verified Refresh button is not available after direct login')

    // Logout again, but this time use the OK button
    console.log('🚪 Testing logout with OK button')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()

    // Click the OK button this time
    await page.getByRole('button', { name: 'OK' }).click()
    console.log('👆 Clicked OK button on logout modal')

    // Verify we're back on the login page
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Logout with OK button successful')
    console.log('✅ Navigation test completed successfully')
  })
})
