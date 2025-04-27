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
    test.setTimeout(120000)

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
    
    // Try multiple selectors for username and password fields
    const usernameInput = await page.waitForSelector('input[type="text"], input[name="username"], input#username', { timeout: 60000 })
    const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"], input#password', { timeout: 60000 })
    
    await usernameInput.fill(username)
    await passwordInput.fill(password)
    
    // Try to find the login button with different selectors
    const loginButton = await page.waitForSelector('button[type="submit"], button:has-text("Login")', { timeout: 60000 })
    await loginButton.click()

    // Wait for redirect back to our app and verify we're on the home page
    await page.waitForURL(/.*\/home$/, { timeout: 60000 })
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('You have successfully logged in')).toBeVisible()

    // Test navigation to different pages
    await page.getByRole('link', { name: 'Profile' }).click()
    await expect(page.url()).toContain('/profile')
    await expect(page.getByText('User Profile')).toBeVisible()

    await page.getByRole('link', { name: 'About' }).click()
    await expect(page.url()).toContain('/about')
    await expect(page.getByText('About EEN Login')).toBeVisible()

    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.url()).toContain('/settings')
    await expect(page.getByText('Settings')).toBeVisible()

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