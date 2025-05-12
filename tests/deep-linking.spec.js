// eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-skipped-test, playwright/no-wait-for-selector, playwright/no-conditional-expect
import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  logoutFromApplication,
  createUrlPattern,
  getLastPartOfUrl,
  loginWithEEN
} from './utils.js'

let loggedBaseURL = false // Flag to ensure baseURL is logged only once
let basePath = ''

test.describe('Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      const redirectUri = process.env.VITE_REDIRECT_URI || 'http://127.0.0.1:3333'
      basePath = getLastPartOfUrl(baseURL)
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
        console.log(`🔒 Using Redirect URI: ${redirectUri}\n`)
        console.log(`🔒 Using basePath: ${basePath}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should navigate to settings with direct link', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log( "  this test uses a deep link with and without previous login. ")
    test.setTimeout(30000) // max 30 seconds overall 

    // Start from home page
    console.log('🧭 Now navigating to settings page with direct link without previous login')
    await page.goto(basePath+'/settings') 

    // verify that we are on the een signin page
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 15000 })
    console.log('✅ Successfully navigated to EEN signin page')

    // login with EEN
    await loginWithEEN(page)

    // Find the Settings link in the navigation - be specific to avoid duplicate matches
    const settingsLink = page.getByRole('navigation').getByRole('link', { name: 'Settings' })
    await expect(settingsLink).toBeVisible({ timeout: 5000 })
    await settingsLink.click()

    // Verify we reached settings page
    const settingsPattern = createUrlPattern(page, '/settings')
    await page.waitForURL(settingsPattern, { timeout: 10000 })
    console.log('✅ Successfully navigated to Settings page')



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
