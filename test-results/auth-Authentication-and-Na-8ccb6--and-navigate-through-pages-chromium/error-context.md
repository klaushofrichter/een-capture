# Test info

- Name: Authentication and Navigation >> should login successfully and navigate through pages
- Location: /Volumes/WDBlack2T/Development/een-login/tests/auth.spec.js:19:3

# Error details

```
Error: page.waitForSelector: Test ended.
Call log:
  - waiting for locator('input[type="text"], input[name="username"], input#username') to be visible

    at /Volumes/WDBlack2T/Development/een-login/tests/auth.spec.js:40:38
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test'
   2 | import dotenv from 'dotenv'
   3 |
   4 | // Load environment variables from .env file
   5 | dotenv.config()
   6 |
   7 | test.describe('Authentication and Navigation', () => {
   8 |   test.beforeEach(async ({ page }) => {
   9 |     // Go to the login page before each test
  10 |     await page.goto('/')
  11 |   })
  12 |
  13 |   test('should show login page with correct elements', async ({ page }) => {
  14 |     // Check if we're on the login page
  15 |     await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
  16 |     await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
  17 |   })
  18 |
  19 |   test('should login successfully and navigate through pages', async ({ page }) => {
  20 |     // Increase timeout for this test
  21 |     test.setTimeout(120000)
  22 |
  23 |     // Get credentials from environment variables
  24 |     const username = process.env.TEST_USER
  25 |     const password = process.env.TEST_PASSWORD
  26 |
  27 |     // Skip test if credentials are not provided
  28 |     test.skip(!username || !password, 'Test credentials not found. Please set TEST_USER and TEST_PASSWORD environment variables.')
  29 |
  30 |     // Click the login button
  31 |     await page.getByText('Sign in with Eagle Eye Networks').click()
  32 |
  33 |     // Wait for redirect to EEN login page and fill in credentials
  34 |     await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 60000 })
  35 |     
  36 |     // Wait for the form to be ready
  37 |     await page.waitForLoadState('networkidle')
  38 |     
  39 |     // Try multiple selectors for username and password fields
> 40 |     const usernameInput = await page.waitForSelector('input[type="text"], input[name="username"], input#username', { timeout: 60000 })
     |                                      ^ Error: page.waitForSelector: Test ended.
  41 |     const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"], input#password', { timeout: 60000 })
  42 |     
  43 |     await usernameInput.fill(username)
  44 |     await passwordInput.fill(password)
  45 |     
  46 |     // Try to find the login button with different selectors
  47 |     const loginButton = await page.waitForSelector('button[type="submit"], button:has-text("Login")', { timeout: 60000 })
  48 |     await loginButton.click()
  49 |
  50 |     // Wait for redirect back to our app and verify we're on the home page
  51 |     await page.waitForURL(/.*\/home$/, { timeout: 60000 })
  52 |     await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
  53 |     await expect(page.getByText('You have successfully logged in')).toBeVisible()
  54 |
  55 |     // Test navigation to different pages
  56 |     await page.getByRole('link', { name: 'Profile' }).click()
  57 |     await expect(page.url()).toContain('/profile')
  58 |     await expect(page.getByText('User Profile')).toBeVisible()
  59 |
  60 |     await page.getByRole('link', { name: 'About' }).click()
  61 |     await expect(page.url()).toContain('/about')
  62 |     await expect(page.getByText('About EEN Login')).toBeVisible()
  63 |
  64 |     await page.getByRole('link', { name: 'Settings' }).click()
  65 |     await expect(page.url()).toContain('/settings')
  66 |     await expect(page.getByText('Settings')).toBeVisible()
  67 |
  68 |     // Test theme switching in settings
  69 |     await page.getByRole('button', { name: 'Dark' }).click()
  70 |     await expect(page.locator('html')).toHaveClass(/dark/)
  71 |
  72 |     await page.getByRole('button', { name: 'Light' }).click()
  73 |     await expect(page.locator('html')).not.toHaveClass(/dark/)
  74 |
  75 |     // Test logout
  76 |     await page.getByRole('button', { name: 'Logout' }).click()
  77 |     await page.getByRole('button', { name: 'OK' }).click()
  78 |     await expect(page.url()).toBe('http://127.0.0.1:3333/')
  79 |   })
  80 | }) 
```