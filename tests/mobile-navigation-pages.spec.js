import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

// Define the mobile viewport size
const mobileViewport = { width: 500, height: 800 }

test.describe('Mobile Navigation - Page Navigation and Logout', () => {
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

  test('should navigate through pages via mobile menu and logout successfully', async ({
    page
  }) => {
    console.log('🔍 Starting mobile navigation and logout test')

    // Verify we're on the home page after login
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Home page loaded')

    // Function to navigate to a page via mobile menu
    async function navigateViaMenu(pageName) {
      // Open the mobile menu
      const hamburgerButton = page.locator('button[aria-controls="mobile-menu"]')
      await hamburgerButton.click()
      console.log(`👆 Opened menu to navigate to ${pageName}`)

      // Wait for menu to be visible
      await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

      // Click the navigation link
      await page.locator(`#mobile-menu a[href="/${pageName.toLowerCase()}"]`).click()
      console.log(`👆 Clicked ${pageName} link`)

      // Wait for navigation to complete
      await page.waitForURL(new RegExp(`.*/${pageName.toLowerCase()}$`), { timeout: 10000 })

      // Verify we're on the expected page without using waitForTimeout
      // Look for any content that would indicate the page has loaded
      try {
        // Wait for any heading that would indicate the page has loaded
        await page.locator('h1, h2, h3').first().waitFor({ state: 'visible', timeout: 2000 })
      } catch (e) {
        console.log(`Warning: Could not find headings on ${pageName} page`)
      }

      console.log(`✅ Navigated to ${pageName} page`)
    }

    // Navigate to About page
    await navigateViaMenu('about')
    // Verify we're on the about page using a specific heading element
    await expect(page.getByRole('heading', { name: 'About EEN Login' })).toBeVisible()

    // Navigate to Settings page
    await navigateViaMenu('settings')
    // Verify we're on the settings page
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()

    // Navigate to Profile page
    await navigateViaMenu('profile')
    // Verify we're on the profile page
    await expect(page.getByRole('heading', { name: /Profile/i })).toBeVisible()

    // Navigate back to Home page
    await navigateViaMenu('home')
    // Verify we're on the home page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()

    // Now test logout functionality
    // Open the mobile menu
    const hamburgerButton = page.locator('button[aria-controls="mobile-menu"]')
    await hamburgerButton.click()
    console.log('👆 Opened menu to logout')

    // Wait for menu to be visible
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Click the logout button/link
    const logoutButton = page.locator('#mobile-menu button').filter({ hasText: 'Logout' })
    await logoutButton.click()
    console.log('👆 Clicked Logout button - this will take 8 or more seconds to complete')

    // Wait for redirect to login page
    // We might have different patterns for the login page URL depending on your auth flow
    // Try various possibilities
    try {
      await page.waitForURL(/.*\/login$|.*\/auth\/login$|^(?!.*\/home$).*$/, { timeout: 10000 })
    } catch (e) {
      console.log(
        '⚠️ Could not detect standard login URL pattern, checking for login button instead'
      )
    }

    // Verify we're logged out by checking for login button presence
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible({ timeout: 10000 })
    console.log('✅ Successfully logged out and returned to login page')

    console.log('✅ Mobile navigation and logout test completed successfully')
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
