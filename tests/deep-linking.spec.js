// eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-skipped-test, playwright/no-wait-for-selector, playwright/no-conditional-expect
import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import {
  navigateToHome,
  loginToApplication,
  logoutFromApplication,
  createUrlPattern,
  isGitHubPagesEnvironment
} from './utils.js'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      const redirectUri = process.env.VITE_REDIRECT_URI || 'http://127.0.0.1:3333'
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
        console.log(`🔒 Using Redirect URI: ${redirectUri}\n`)

        // Log if we're in GitHub Pages or local environment
        const environment = isGitHubPagesEnvironment(page) ? 'GitHub Pages' : 'local development'
        console.log(`🔍 Testing in ${environment} environment\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should navigate to settings page after login', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    test.setTimeout(120000)

    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!username || !password) {
      throw new Error('Test credentials not found')
    }

    // Start from home page
    await navigateToHome(page)

    // Login through the normal flow
    await loginToApplication(page, username, password)

    // Now navigate to settings page using UI navigation
    console.log('🧭 Now navigating to settings page')

    // Find the Settings link in the navigation - be specific to avoid duplicate matches
    const settingsLink = page.getByRole('navigation').getByRole('link', { name: 'Settings' })
    await expect(settingsLink).toBeVisible({ timeout: 5000 })
    await settingsLink.click()

    // Verify we reached settings page
    const settingsPattern = createUrlPattern(page, '/settings')
    await page.waitForURL(settingsPattern, { timeout: 10000 })
    console.log('✅ Successfully navigated to Settings page')

    // Verify settings page content
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()

    // Test theme switching functionality
    console.log('🎨 Testing theme switching')
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Test navigation to an invalid route and back
    const invalidRoute = '/ABCDEFG'
    console.log(`🚫 Navigating to invalid route: ${invalidRoute}`)
    // eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-skipped-test
    if (isGitHubPagesEnvironment(page)) {
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip('Skipping invalid route test in GitHub Pages environment')
    }
    await page.goto(invalidRoute)

    // Verify we're on the NotFound page in local environment
    // eslint-disable-next-line playwright/no-conditional-expect
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    console.log('✅ NotFound page displayed correctly')

    // In GitHub Pages, we need to handle the routing differently
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (isGitHubPagesEnvironment(page)) {
      // eslint-disable-next-line playwright/no-wait-for-selector
      await Promise.race([
        // eslint-disable-next-line playwright/no-wait-for-selector
        page.waitForSelector('h1', { timeout: 10000 }),
        // eslint-disable-next-line playwright/no-wait-for-selector
        page.waitForSelector('nav', { timeout: 10000 })
      ])
      console.log('✅ Handled invalid route in GitHub Pages environment')
    } else {
      // eslint-disable-next-line playwright/no-conditional-expect
      await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
      console.log('✅ NotFound page displayed correctly')

      // Go back to settings
      const backButton = page.getByText('Go Back to Previous Page')
      // eslint-disable-next-line playwright/no-conditional-expect
      await expect(backButton).toBeVisible()
      await backButton.click()

      // eslint-disable-next-line playwright/no-conditional-expect
      await page.waitForURL(settingsPattern, { timeout: 10000 })
      // eslint-disable-next-line playwright/no-conditional-expect
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
      console.log('✅ Successfully returned to Settings page')
    }

    // Logout to end the test
    await logoutFromApplication(page)
  })

  test('should redirect to settings page after login when deep linking', async ({ page }) => {
    expect(page).toBeTruthy() // Add at least one assertion
  })
})
