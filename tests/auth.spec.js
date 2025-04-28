import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false; // Flag to ensure baseURL is logged only once

test.describe('Authentication and Navigation', () => {
  // REMOVED test.beforeAll hook

  test.beforeEach(async ({ page }) => {
    // Log Base URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL;
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}\n`);
      }
      loggedBaseURL = true; // Set flag so it doesn't log again
    }
    // Go to the login page before each test
    await page.goto('/')
  })

  test('login page should have correct elements and consistent styling', async ({ page }) => {
    // Check if we're on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()

    // Check bottom elements styling
    const bottomDiv = page.locator('.absolute.bottom-4')
    await expect(bottomDiv).toBeVisible()

    // Get all text elements in the bottom div
    const version = bottomDiv.locator('span').first()
    const separator = bottomDiv.locator('span').nth(1)
    const readme = bottomDiv.locator('a')

    // Check version element
    await expect(version).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+$/)

    // Check separator
    await expect(separator).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(separator).toHaveText(/\|/)

    // Check README link
    await expect(readme).toHaveClass(/text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400/)
    await expect(readme).toHaveAttribute('href', 'https://github.com/klaushofrichter/een-login/blob/develop/README.md')
  })

  test('direct page should have correct elements and consistent styling', async ({ page }) => {
    // Navigate directly to the direct page
    await page.goto('/direct')

    // Check if we're on the direct page
    await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()

    // Check for form elements
    await expect(page.getByLabel('Access Token')).toBeVisible()
    await expect(page.getByLabel('Base URL')).toBeVisible()
    await expect(page.getByLabel('Port')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible()

    // Check bottom elements styling
    const bottomDiv = page.locator('.absolute.bottom-4')
    await expect(bottomDiv).toBeVisible()

    // Get all text elements in the bottom div
    const version = bottomDiv.locator('span').first()
    const separator = bottomDiv.locator('span').nth(1)
    const readme = bottomDiv.locator('a')

    // Check version element
    await expect(version).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+$/)

    // Check separator
    await expect(separator).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(separator).toHaveText(/\|/)

    // Check README link
    await expect(readme).toHaveClass(/text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400/)
    await expect(readme).toHaveAttribute('href', 'https://github.com/klaushofrichter/een-login/blob/develop/README.md')
  })

  test('should login successfully and navigate through pages', async ({ page }) => {
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

    // Click the login button
    await page.getByText('Sign in with Eagle Eye Networks').click()

    // Wait for redirect to EEN login page and fill in credentials
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })

    // Wait for the form to be ready - using both network idle and DOM content loaded
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Wait a bit to ensure form is fully loaded
    await page.waitForTimeout(2000)

    console.log('Attempting to fill email field...')
    
    // Target email input using ID
    await page.locator('#authentication--input__email').fill(username)
    
    console.log('Email field filled successfully')

    // Find and click the next button
    await page.getByRole('button', { name: 'Next' }).click()
    
    console.log('Next button clicked')
    
    // Wait for password field to appear
    await page.waitForTimeout(2000)

    // Target password input field directly by ID
    console.log('Attempting to fill password field...')
    await page.locator('#authentication--input__password').fill(password)
    console.log('Password field filled successfully')

    // Wait to ensure form submission is ready
    await page.waitForTimeout(1000)

    // Find and click the sign in button using ID
    console.log('Attempting to click sign in button...')
    try {
      // Try by ID first
      await page.locator('#next').click()
      console.log('Clicked sign in button by ID')
    } catch (error) {
      console.log('Could not find sign in button by ID, trying text...')
      
      // Try by text
      await page.getByRole('button', { name: 'Sign in' }).click()
      console.log('Clicked sign in button by text')
    }
    
    console.log('Sign in button clicked successfully')

    // Wait for redirect back to our app and verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    await page.waitForLoadState('domcontentloaded')
    console.log('Checked for home page')

    // Test navigation to different pages
    await page.getByRole('navigation').getByRole('link', { name: 'Profile' }).click()
    await page.waitForURL(/.*\/profile$/, { timeout: 30000 })
    await expect(page.getByText('User Profile')).toBeVisible({ timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    console.log('Checked for profile page')
    
    // Capture credentials from the Profile page
    console.log('Capturing credentials from Profile page')
    
    // Click the Show & Copy button to reveal the token
    await page.getByRole('button', { name: 'Show & Copy' }).click()
    
    // Capture the access token - now it should be visible as text
    const accessToken = await page.locator('input[type="text"]').inputValue()
    console.log('Access token captured')
    
    // Capture the base URL using the proper selector
    const baseUrl = await page.locator('label:has-text("Base URL")').evaluate(label => {
      return label.nextElementSibling.value;
    });
    console.log('Base URL captured: ', baseUrl)
    
    // Capture the port using the proper selector
    const port = await page.locator('label:has-text("Port")').evaluate(label => {
      return label.nextElementSibling.value;
    });
    console.log('Port captured: ', port)
    
    await page.getByRole('navigation').getByRole('link', { name: 'About' }).click()
    await page.waitForURL(/.*\/about$/, { timeout: 10000 })
    await expect(page.getByText('About EEN Login')).toBeVisible()
    await page.waitForLoadState('domcontentloaded')
    console.log('Checked for about page')

    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.waitForURL(/.*\/settings$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.waitForLoadState('domcontentloaded')

    // Test theme switching in settings
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    console.log('Checked for settings page')

    // Test logout - first with cancel
    console.log('Testing logout with cancel')
    await page.getByRole('button', { name: 'Logout' }).click()

    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText('Thank you for using')).toBeVisible()

    // Wait a few seconds before canceling
    await page.waitForTimeout(3000)
    
    // Click the cancel button
    await page.getByRole('button', { name: 'Cancel Logout' }).click()
    
    // Verify modal is gone
    await expect(page.getByText('Goodbye!')).not.toBeVisible()
    console.log('Cancel logout successful')
    
    // Verify we're still on the settings page
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    
    // Now test logout with completion
    console.log('Testing full logout')
    await page.getByRole('button', { name: 'Logout' }).click()
    
    // Verify the logout modal is shown again
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText('Thank you for using')).toBeVisible()

    // Wait for the logout to complete automatically
    // Using the more appropriate expect with a timeout instead of waitForTimeout
    await expect(page).toHaveURL('/', { timeout: 15000 })

    // Verify we're back on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
    console.log('Checked logout')
    
    // Now test direct access with the captured credentials
    console.log('Testing Direct Access with captured credentials')
    
    // Navigate to the direct access page
    await page.goto('/direct')
    await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()
    
    // Fill in the captured credentials
    await page.getByLabel('Access Token').fill(accessToken)
    await page.getByLabel('Base URL').fill(baseUrl)
    await page.getByLabel('Port').fill(port)
    
    // Click the Proceed button
    await page.getByRole('button', { name: 'Proceed' }).click()
    
    // Verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    console.log('Direct access successful')
    
    // Logout again, but this time use the OK button
    console.log('Testing logout with OK button')
    await page.getByRole('button', { name: 'Logout' }).click()
    
    // Verify the logout modal is shown
    await expect(page.getByText('Goodbye!')).toBeVisible()
    
    // Click the OK button this time
    await page.getByRole('button', { name: 'OK' }).click()
    
    // Verify we're back on the login page
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('Logout with OK button successful')
  })
})
