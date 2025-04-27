import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

test.describe('Authentication and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the login page before each test
    await page.goto('/')
  })

  test('should show login page with correct elements', async ({ page }) => {
    // Check if we're on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
  })

  test('should login successfully and navigate through pages', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(30000)

    // Get credentials from environment variables
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD

    // Skip test if credentials are not provided
    test.skip(!username || !password, 'Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.')

    // Click the login button
    await page.getByText('Sign in with Eagle Eye Networks').click()

    // Wait for redirect to EEN login page and fill in credentials
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 60000 })
    
    // Wait for the form to be ready
    await page.waitForLoadState('networkidle')
    
    // email
    const emailInput = await page.waitForSelector('#authentication--input__email', { timeout: 10000 })
    await emailInput.fill(username)

    // Find and click the next button
    const nextButton = await page.waitForSelector('button[type="submit"]', { timeout: 10000 })
    await nextButton.click()
    
    // password input
    const passwordInput = await page.waitForSelector('#authentication--input__password', { timeout: 10000 })    
    await passwordInput.fill(password)
    
    // Find and click the login button
    const loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 10000 })
    await loginButton.click()

    // Wait for redirect back to our app and verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 10000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()
    await page.waitForLoadState('networkidle')

    // Test navigation to different pages
    await page.getByRole('navigation').getByRole('link', { name: 'Profile' }).click()
    await page.waitForURL(/.*\/profile$/, { timeout: 10000 })
    await expect(page.getByText('User Profile')).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.getByRole('navigation').getByRole('link', { name: 'About' }).click()
    await page.waitForURL(/.*\/about$/, { timeout: 10000 })
    await expect(page.getByText('About EEN Login')).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.waitForURL(/.*\/settings$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.waitForLoadState('networkidle')

    // Test theme switching in settings
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Test logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.url()).toBe('http://127.0.0.1:3333/')
  })
}) 