// eslint-disable-next-line playwright/no-conditional-in-test
import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
// eslint-disable-next-line no-unused-vars
import { navigateToHome, loginToApplication, logoutFromApplication, isGitHubPagesEnvironment } from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Token Revocation', () => {
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

        // Log if we're in GitHub Pages or local environment
        const environment = isGitHubPagesEnvironment(page) ? 'GitHub Pages' : 'local development'
        console.log(`🔍 Testing in ${environment} environment\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('should revoke token on logout', async ({ page }) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (isGitHubPagesEnvironment(page)) {
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip('Skipping token revocation test in GitHub Pages environment')
    }
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting token revocation test')

    // Increase timeout for this test
    test.setTimeout(120000)

    // Get credentials from environment variables
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // Ensure credentials are provided
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!username || !password) {
      throw new Error(
        'Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.'
      )
    }

    // go directly to the home page
    await navigateToHome(page)
    await loginToApplication(page, username, password)

    // we expect to be on the home page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible({ timeout: 10000 })
    console.log('✅ Home page displayed correctly')

    // go to the profile page
    await page.goto('/profile')  // this does not click the button in the navigation bar
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 })
    console.log('✅ Profile page displayed correctly')

    // find the Show and Copy button 
    const showCopyButton = page.getByRole('button', { name: 'Show & Copy' })
    await showCopyButton.click()
    console.log('✅ Show and Copy button clicked')

    // wait for the hide button to be visible
    const hideButton = page.getByRole('button', { name: 'Hide' })
    await expect(hideButton).toBeVisible({ timeout: 10000 })
    console.log('✅ Hide button displayed correctly')

    // retrieve the access token from the input field (try label, then fallback to readonly input)
    let accessTokenInput
    try {
      accessTokenInput = page.locator('#access-token')
      await expect(accessTokenInput).toBeVisible({ timeout: 10000 })
      console.log('✅ Access token input field found correctly')
    } catch (e) {
      accessTokenInput = page.locator('input[readonly]').nth(2)
      await expect(accessTokenInput).toBeVisible({ timeout: 10000 })
      console.log('✅ Access token input field found by fallback')
    }
    const accessToken = await accessTokenInput.inputValue()
    console.log('✅ Access token retrieved from input field') 

    // logout
    await logoutFromApplication(page)

   // go to the direct page
   await page.goto('/direct')
   await expect(page.getByRole('heading', { name: 'Direct' })).toBeVisible({ timeout: 10000 })
   console.log('✅ Direct page displayed correctly')

    // enter the access token into the text field
    await page.locator('#token').fill(accessToken)
    console.log('✅ Access token entered into text field')

    // clck the proceed button
    const backToLoginButton = page.getByRole('button', { name: 'Back to Login' })
    const proceedButton = page.getByRole('button', { name: 'Proceed' })
    await proceedButton.click()
    console.log('✅ Proceed button clicked')

    // wait for text to show that the token was revoked
    await expect(page.getByText('The client caller does not have a valid authentication credential')).toBeVisible({ timeout: 10000 })
    console.log('✅ Token revoked text displayed correctly')

    // press the "back to login" button
    await backToLoginButton.click()
    console.log('✅ Back to Login button clicked')

    // check that we are on the login page
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 10000 })
    console.log('✅ Login page displayed correctly')

    console.log('✅ Token revocation test completed successfully')
  })
})
