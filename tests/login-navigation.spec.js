import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import { navigateToHome, loginToApplication, isGitHubPagesEnvironment } from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Login and Navigation', () => {
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
    // Go to the login page before each test
    await page.goto('/')
  })

  test('should login successfully and navigate through pages', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting login and navigation test')
    test.setTimeout(180000) // Increase timeout further

    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // Skip if no credentials
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
  })

  test('should display not found page after login when navigating to invalid route', async ({
    page
  }) => {
    if (isGitHubPagesEnvironment(page)) {
      test.skip('Skipping invalid route test in GitHub Pages environment')
    }
    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

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
