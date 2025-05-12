import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import {
  navigateToHome,
  loginToApplication,
  logoutFromApplication,
  getLastPartOfUrl
} from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once
let basePath = ''

// Define the mobile viewport size
const mobileViewport = { width: 500, height: 800 }

test.describe('Mobile Navigation - Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      basePath = getLastPartOfUrl(baseURL)
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
        console.log(`🔍 Base path: ${basePath}`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }

    // Set mobile viewport size for all tests in this group
    await page.setViewportSize(mobileViewport)
    console.log('📱 Set viewport to mobile size:', mobileViewport)
  })

  test('should navigate through all pages via mobile menu', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting mobile page navigation test')

    // Navigate to home page
    await navigateToHome(page)

    // Login before each test
    await loginToApplication(page)

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
    const profileUrl= basePath + '/profile'
    await page.waitForURL(profileUrl, { timeout: 10000 })
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
    const aboutUrl = basePath + '/about'
    await page.waitForURL(aboutUrl, { timeout: 10000 })
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
    const settingsUrl = basePath + '/settings'
    await page.waitForURL(settingsUrl, { timeout: 10000 })
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
    const homeUrl = basePath + '/home'
    await page.waitForURL(homeUrl, { timeout: 10000 })
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
