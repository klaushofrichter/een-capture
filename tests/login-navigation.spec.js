// eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-skipped-test
import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import { navigateToHome, loginToApplication, isGitHubPagesEnvironment, logoutFromApplication } from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Login and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL and Proxy URL once before the first test runs
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
    // Go to the login page before each test
    await page.goto('/')
  })

  test('should login successfully and navigate through pages', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting login and navigation test')
    //test.setTimeout(20000) 

    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!username || !password) {
      throw new Error('Test credentials not found')
    }

    // Start from home page
    await navigateToHome(page)

    // Use our utility function for login
    await loginToApplication(page, username, password)

    // Add assertions to verify successful login
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    expect(page.url()).toContain('/home')
    console.log('✅ Successfully logged in - home page')

    // click the "settings" button in the navigation bar
    const settingsButton = page.getByRole('link', { name: 'Settings' }).first()
    await settingsButton.click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 }) 
    expect(page.url()).toContain('/settings')
    console.log('✅ Successfully navigated to Settings page')

    // click the "about" button in the navigation bar
    const aboutButton = page.getByRole('link', { name: 'About' }).first()
    await aboutButton.click()
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible({ timeout: 10000 }) 
    expect(page.url()).toContain('/about')
    console.log('✅ Successfully navigated to About page')

    // click the "profile" button in the navigation bar
    const profileButton = page.getByRole('link', { name: 'profile' }).first()
    await profileButton.click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 }) 
    expect(page.url()).toContain('/profile')
    console.log('✅ Successfully navigated to Profile page')

    // click the "home" button in the navigation bar
    const homeButton = page.getByRole('link', { name: 'home' }).first()
    await homeButton.click()
    //await expect(page.getByRole('heading', { name: 'home' })).toBeVisible({ timeout: 10000 }) 
    expect(page.url()).toContain('/home')
    console.log('✅ Successfully navigated to Home page')

    // logout
    await logoutFromApplication(page)
    console.log('✅ Successfully logged out')
  })

  test('should display not found page after login when navigating to invalid route', async ({
    page
  }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-skipped-test
    if (isGitHubPagesEnvironment(page)) {
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip('Skipping invalid route test in GitHub Pages environment')
    }
    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!username || !password) {
      throw new Error('Test credentials not found')
    }

    // Login first
    await navigateToHome(page)
    await loginToApplication(page, username, password)

    // Navigate to invalid route
    await page.goto('/invalid-route')

    // Verify not found page
    await expect(page.getByText('Page Not Found')).toBeVisible()
    expect(page.url()).toContain('/invalid-route')
  })
})
