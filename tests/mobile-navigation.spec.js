import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

// Define the mobile viewport size
const mobileViewport = { width: 500, height: 800 }

test.describe('Mobile Navigation - Menu Functionality', () => {
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

    // Set mobile viewport size for all tests in this group
    await page.setViewportSize(mobileViewport)
    console.log('📱 Set viewport to mobile size:', mobileViewport)

    // Login before each test since we need to be authenticated to see the navigation
    await loginUser(page)
  })

  test('should open and close mobile menu correctly', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`);
    console.log('🔍 Starting mobile navigation test')

    // Verify we're on the home page after login
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Home page loaded')

    // Check that mobile menu button (hamburger) is visible in mobile view
    const hamburgerButton = page.locator('button[aria-controls="mobile-menu"]')
    await expect(hamburgerButton).toBeVisible()
    console.log('✅ Hamburger menu button is visible')

    // Initially the mobile menu should be hidden
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).toHaveClass(/hidden/)
    console.log('✅ Mobile menu is initially hidden')

    // Open the mobile menu by clicking the hamburger
    await hamburgerButton.click()
    console.log('👆 Clicked hamburger button')

    // Menu should now be visible - check for visible elements within the menu
    // instead of checking classes which may contain "hidden" as part of responsive class names
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })
    console.log('✅ Mobile menu is now visible')

    // Check for overlay presence
    const overlay = page.locator('.fixed.inset-0.z-20')
    await expect(overlay).toBeVisible()
    console.log('✅ Overlay is visible')

    // Click the overlay to close the menu
    await overlay.click()
    console.log('👆 Clicked overlay to close menu')

    // Menu should now be hidden
    await expect(mobileMenu).toHaveClass(/hidden/)
    console.log('✅ Menu closed after clicking overlay')

    // Reopen the menu for further testing
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    // Verify menu is open
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Test closing the menu by explicitly clicking the overlay
    await overlay.click()
    console.log('👆 Clicked overlay to close menu')

    // Menu should now be hidden
    await expect(mobileMenu).toHaveClass(/hidden/)
    console.log('✅ Menu closed after clicking overlay')

    // Reopen the menu
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    // Verify menu is open
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Test closing by pressing ESC key
    await page.keyboard.press('Escape')
    console.log('⌨️ Pressed ESC key')

    // Menu should now be hidden again
    await expect(mobileMenu).toHaveClass(/hidden/)
    console.log('✅ Menu closed after pressing ESC')

    // Reopen the menu once more
    await hamburgerButton.click()
    console.log('👆 Reopened the menu again')
    // Verify menu is open
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Test closing by clicking a navigation item
    // Use very specific selector to make sure we get only the mobile menu's Profile link
    await page.locator('#mobile-menu a[href="/profile"]').click()
    console.log('👆 Clicked Profile navigation link in mobile menu')

    // Should navigate to Profile page and close menu
    await page.waitForURL(/.*\/profile$/, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible()

    // Menu should be hidden
    await expect(mobileMenu).toHaveClass(/hidden/)
    console.log('✅ Menu closed after navigation')
    console.log('✅ Navigated to Profile page successfully')

    console.log('✅ Mobile navigation test completed successfully')
  })
})

// Helper function to login
async function loginUser(page) {
  console.log('🔑 Starting login process for test')

  // Navigate to the login page
  await page.goto('/')

  // Get credentials from environment variables
  const username = process.env.TEST_USER
  const password = process.env.TEST_PASSWORD

  // Ensure credentials are provided
  if (!username || !password) {
    throw new Error(
      'Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.'
    )
  }

  // Click the login button
  await page.getByText('Sign in with Eagle Eye Networks').click()

  // Wait for redirect to EEN login page
  await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })

  // Wait for the email field to be visible and ready
  const emailInput = page.locator('#authentication--input__email')
  await expect(emailInput).toBeVisible({ timeout: 15000 })
  await emailInput.fill(username)

  // Find and click the next button
  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeEnabled()
  await nextButton.click()

  // Wait for password field to appear and be ready
  const passwordInput = page.locator('#authentication--input__password')
  await expect(passwordInput).toBeVisible({ timeout: 10000 })
  await passwordInput.fill(password)

  // Click the sign in button (try both methods)
  const signInButton = page.locator('#next')
  const signInButtonByText = page.getByRole('button', { name: 'Sign in' })
  await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 })

  try {
    await signInButton.click()
  } catch (error) {
    await signInButtonByText.click()
  }

  // Wait for redirect back to our app and verify we're on the home page
  await page.waitForURL(/.*\/home$/, { timeout: 15000 })
  await expect(page.getByText('Welcome to EEN Login')).toBeVisible()

  console.log('✅ Login completed successfully')
}
