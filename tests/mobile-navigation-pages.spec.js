import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import {
  navigateToHome,
  loginToApplication,
  logoutFromApplication,
  isGitHubPagesEnvironment,
  createUrlPattern
} from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

// Define the mobile viewport size
const mobileViewport = { width: 500, height: 800 }

test.describe('Mobile Navigation - Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)

        // Log if we're in GitHub Pages or local environment
        const environment = isGitHubPagesEnvironment(page) ? 'GitHub Pages' : 'local development'
        console.log(`🔍 Testing in ${environment} environment\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }

    // Set mobile viewport size for all tests in this group
    await page.setViewportSize(mobileViewport)
    console.log('📱 Set viewport to mobile size:', mobileViewport)

    // Navigate to home page
    await navigateToHome(page)

    // Get credentials from environment variables
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // Skip if no credentials
    if (!username || !password) {
      throw new Error('Test credentials not found')
    }

    // Login before each test
    await loginToApplication(page, username, password)
  })

  test('should navigate through all pages via mobile menu', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting mobile page navigation test')

    // Verify we're on the home page after login
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Home page loaded')

    // Open the mobile menu
    const hamburgerButton = page.locator('button[aria-controls="mobile-menu"]')
    await expect(hamburgerButton).toBeVisible()
    await hamburgerButton.click()
    console.log('👆 Opened the mobile menu')

    // Wait for menu to be visible
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Navigate to Profile page
    console.log('👤 Navigating to Profile page')
    await page.locator('#mobile-menu a[href*="/profile"]').click()

    // Use our URL pattern utility
    const profilePattern = createUrlPattern(page, '/profile')
    await page.waitForURL(profilePattern, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible()
    console.log('✅ Profile page loaded successfully')

    // Reopen the menu
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Navigate to About page
    console.log('ℹ️ Navigating to About page')
    await page.locator('#mobile-menu a[href*="/about"]').click()

    // Use our URL pattern utility
    const aboutPattern = createUrlPattern(page, '/about')
    await page.waitForURL(aboutPattern, { timeout: 10000 })
    await expect(page.getByText('About EEN Login')).toBeVisible()
    console.log('✅ About page loaded successfully')

    // Reopen the menu
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Navigate to Settings page
    console.log('⚙️ Navigating to Settings page')
    await page.locator('#mobile-menu a[href*="/settings"]').click()

    // Use our URL pattern utility
    const settingsPattern = createUrlPattern(page, '/settings')
    await page.waitForURL(settingsPattern, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    console.log('✅ Settings page loaded successfully')

    // Reopen the menu
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Navigate back to Home page
    console.log('🏠 Navigating back to Home page')
    await page.locator('#mobile-menu a[href*="/home"]').click()

    // Use our URL pattern utility
    const homePattern = createUrlPattern(page, '/home')
    await page.waitForURL(homePattern, { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Home page loaded successfully')

    // Test logout from mobile menu
    // Reopen the menu
    await hamburgerButton.click()
    console.log('👆 Reopened the menu')
    await page.locator('#mobile-menu a').first().waitFor({ state: 'visible' })

    // Click Logout in the mobile menu
    console.log('🚪 Clicking logout in mobile menu')
    await page.locator('#mobile-menu button:has-text("Logout")').click()

    // Call our logout utility function with the fromMobile parameter set to true
    await logoutFromApplication(page, true)
    console.log('✅ Mobile page navigation test completed successfully')
  })
})
