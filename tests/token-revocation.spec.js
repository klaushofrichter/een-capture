import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Token Revocation Test', () => {
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

  test('should prevent login with revoked token', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`);
    console.log('🔍 Starting token revocation test')

    // Increase timeout for this test
    test.setTimeout(120000)

    // 1. Start at root and navigate to profile
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('🚀 Starting login process')
    // Click the login button
    await page.getByText('Sign in with Eagle Eye Networks').click()

    // Wait for redirect to EEN login page
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 30000 })
    console.log('✅ Redirected to EEN login page')

    // Wait for the email field to be visible and ready
    const emailInput = page.locator('#authentication--input__email')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await expect(emailInput).toBeEnabled()

    console.log('👤 Attempting to fill email field...')
    await emailInput.fill(process.env.TEST_USER)
    console.log('✅ Email field filled successfully')

    // Find and click the next button, wait for it to be enabled
    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    console.log('➡️ Next button clicked')

    // Wait for password field to appear and be ready
    const passwordInput = page.locator('#authentication--input__password')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeEnabled()

    console.log('🔑 Attempting to fill password field...')
    await passwordInput.fill(process.env.TEST_PASSWORD)
    console.log('✅ Password field filled successfully')

    // Wait for the sign in button to be ready
    const signInButton = page.locator('#next')
    const signInButtonByText = page.getByRole('button', { name: 'Sign in' })
    await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 })

    // Find and click the sign in button
    console.log('🔐 Attempting to click sign in button...')
    try {
      await signInButton.click()
      console.log('✅ Clicked sign in button by ID')
    } catch (error) {
      console.log('⚠️ Could not find sign in button by ID, trying text...')
      await signInButtonByText.click()
      console.log('✅ Clicked sign in button by text')
    }

    // Wait for redirect back to our app and navigate to profile
    await page.waitForURL(/.*\/home$/, { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Successfully logged in')
    
    // Navigate to Profile page
    console.log('👤 Navigating to Profile page')
    await page.getByRole('navigation').getByRole('link', { name: 'Profile' }).click()
    await page.waitForURL(/.*\/profile$/, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible({ timeout: 10000 })
    console.log('✅ Profile page loaded')
    
    // 3. Get access token and base URL
    console.log('🔑 Getting access token and base URL')
    await page.getByRole('button', { name: 'Show & Copy' }).click()
    
    // Wait for the values to be visible
    const tokenInput = page.locator('input[type="text"]')
    await expect(tokenInput).toBeVisible()
    await expect(tokenInput).toBeEnabled()
    const accessToken = await tokenInput.inputValue()
    
    // Get the base URL
    const baseUrl = await page.locator('label:has-text("Base URL")').evaluate(label => {
      return label.nextElementSibling.value
    })
    console.log('✅ Credentials captured successfully')
    
    // 4. Logout with full waiting time
    console.log('🚪 Starting logout process - this will take 8 seconds')
    await page.getByRole('button', { name: 'Logout' }).click()
    
    // Wait for the logout to complete automatically
    await expect(page.getByText('Goodbye!')).toBeVisible()
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible()
    await expect(page).toHaveURL('/', { timeout: 15000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    console.log('✅ Logged out successfully')
    
    // Add extra wait after logout to ensure token revocation is complete
    console.log('⏳ Waiting additional 10 seconds for token revocation to complete...')
    await page.waitForTimeout(10000)
    console.log('✅ Extra wait completed')
    
    // 5. Navigate to direct access page
    console.log('🔄 Testing revoked token via direct access')
    await page.goto('/direct')
    await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()
    
    // 6. Fill in the previously obtained credentials
    console.log('🔑 Attempting to use revoked credentials')
    await page.getByLabel('Access Token').fill(accessToken)
    await page.getByLabel('Base URL').fill(baseUrl)
    
    // 7. Click proceed and verify login fails
    await page.getByRole('button', { name: 'Proceed' }).click()
    console.log('➡️ Clicked Proceed button')
    
    // Wait for any network requests to complete
    await page.waitForLoadState('networkidle')
    console.log('✅ Network requests completed')
    
    // Verify we're still on the direct page (login failed)
    await expect(page).toHaveURL('/direct')
    console.log('✅ Still on direct page after using revoked token')
    
    // Debug: Log the page content
    const pageContent = await page.content()
    console.log('📄 Page content after login attempt:', pageContent)
    
    // Look for error messages in multiple possible locations
    const errorSelectors = [
      '.text-red-600.dark\\:text-red-400',  // Original error class
      '[role="alert"]',                      // Common accessibility attribute for errors
      '.text-red-500',                       // Alternative error class
      'text-error',                          // Another common error class
      '*[class*="error" i]'                  // Any element with 'error' in its class (case insensitive)
    ]
    
    // Try each selector
    let errorFound = false
    let errorMessage = ''
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector)
      try {
        await errorElement.waitFor({ timeout: 5000 })
        errorMessage = await errorElement.textContent()
        console.log(`✅ Found error message with selector "${selector}":`, errorMessage)
        errorFound = true
        break
      } catch (e) {
        console.log(`ℹ️ No error found with selector "${selector}"`)
      }
    }
    
    // If no specific error element is found, check if we're still on the direct page
    // which also indicates the login failed (successful login would navigate away)
    if (!errorFound) {
      console.log('ℹ️ No explicit error message found, verifying login failed by checking URL')
      await expect(page).toHaveURL('/direct')
      await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()
      console.log('✅ Verified login failed (still on direct access page)')
    } else {
      // If we found an error message, verify it indicates authentication failure
      const validErrorMessages = [
        'The client caller does not have a valid authentication credential',
        'Invalid authentication credentials',
        'Authentication failed',
        'Invalid token',
        'error',
        'failed'
      ]
      
      const isValidError = validErrorMessages.some(msg => 
        errorMessage.toLowerCase().includes(msg.toLowerCase())
      )
      expect(isValidError).toBeTruthy()
      console.log('✅ Verified error message indicates authentication failure')
    }
    
    console.log('✅ Token revocation test completed successfully')
  })
}) 