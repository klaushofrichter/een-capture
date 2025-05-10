import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'
import { isGitHubPagesEnvironment, navigateToHome, loginToApplication, logoutFromApplication } from './utils'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Invalid Route Navigation', () => {
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
  })

  test('should display not found page after login when navigating to invalid route', async ({
    page
  }) => {
    if (isGitHubPagesEnvironment(page)) {
      test.skip('Skipping invalid route test in GitHub Pages environment')
    }
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting invalid route test')

    // Increase timeout for this test
    test.setTimeout(120000)
    
    // Get credentials from environment variables
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD
  
    // Ensure credentials are provided
    if (!username || !password) {
      throw new Error('Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.')
    }

    // go directly to the invalid route
    await page.goto('/abcdefg')


    // Wait for redirect to EEN
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 15000 })
    console.log('✅ Redirected to EEN login page')

    // Fill email
    var emailInput = page.locator('#authentication--input__email')
    await emailInput.waitFor({ state: 'visible', timeout: 15000 })
    await emailInput.fill(username)

    // Click next
    await page.getByRole('button', { name: 'Next' }).click()

    // Fill password
    var passwordInput = page.locator('#authentication--input__password')
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.fill(password)

    // Click sign in
    var signInButton = page.locator('#next')
    var signInButtonByText = page.getByRole('button', { name: 'Sign in' })
    try {
      await signInButton.click()
    } catch (error) {
      await signInButtonByText.click()
    }    

    // Verify not found page
    const notFoundLocator = page.getByText('Page Not Found')
    try {
      await expect(notFoundLocator).toBeVisible({ timeout: 5000 })
    } catch (e) {
      const currentUrl = page.url()
      const bodyText = await page.locator('body').innerText()
      console.log('❌ "Page Not Found" not visible!')
      console.log('Current URL:', currentUrl)
      console.log('Page content snippet:', bodyText.slice(0, 500))
      throw e
    }
    expect(page.url()).toContain('/abcdefg')

    // we expect to be on the Not Found page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    console.log('✅ NotFound page displayed correctly')

    // check for the Go Back to Previous Page button
    await expect(page.getByText(/Go Back to/)).toBeHidden({ timeout: 10000 })
    console.log('✅ "Go Back to Previous Page" button is correctly not visible')

    // check for the Go to Home button
    await expect(page.getByText('Go to Home')).toBeVisible({ timeout: 10000 })
    console.log('✅ "Go to Home" button is correctly visible')  

    // use the Go Back to home button to go back to the home page
    await page.getByText('Go to Home').click({ timeout: 10000 })
    console.log('👈 Clicked "Go to Home" button')

    // we expect to be on the home page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible({ timeout: 10000 })
    console.log('✅ Home page displayed correctly') 

    // Navigate to About page
    console.log('👈 Clicking "About" button')
    await page.getByRole('navigation').getByRole('link', { name: 'About' }).click()
    await page.waitForURL(/.*\/about$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible({ timeout: 10000 })

    // we expect to be on the about page
    await expect(page.getByRole('heading', { name: 'About EEN Login' })).toBeVisible({ timeout: 10000 })
    console.log('✅ About page displayed correctly')

    // go to another invalid route
    await page.goto('/hijhlm')

    // Verify we're on the NotFound page
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`The page /hijhlm does not exist.`)).toBeVisible()
    console.log('✅ NotFound page displayed correctly')

    // Verify the "Go Back to Previous Page" button is visible
    await expect(page.getByText(/Go Back to/)).toBeVisible()
    console.log('✅ "Go Back to Previous Page" button is correctly visible')

    // Verify navigation buttons are present
    await expect(page.getByText('Go to Home')).toBeVisible()

    // Navigate to home by clicking the button
    console.log('🏠 Clicking Back to Previous Page button to go back to the home page')
    await page.getByText('Go Back to Previous Page').click()

    // Verify we're now on the settings page

    await page.waitForURL(/.*\/about$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible({ timeout: 10000 })
    console.log('✅ Navigated to About page successfully')

    // logout
    await logoutFromApplication(page)
    console.log('✅ Logged out successfully')

    console.log('✅ Invalid route test completed successfully')
  })
})
