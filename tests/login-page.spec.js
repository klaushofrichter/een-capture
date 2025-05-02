import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
    // Go to the login page before each test
    await page.goto('/')
  })

  test('login page should have correct elements and consistent styling', async ({ page }) => {
    console.log('🔍 Starting login page elements test')

    // Check if we're on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible()
    await expect(page.getByText('Sign in with Eagle Eye Networks')).toBeVisible()
    console.log('✅ Login page main elements verified')

    // Check bottom elements styling
    const bottomDiv = page.locator('.absolute.bottom-4')
    await expect(bottomDiv).toBeVisible()
    console.log('🔎 Checking footer elements')

    // Get all text elements in the bottom div
    const version = bottomDiv.locator('span').first()
    const separator = bottomDiv.locator('span').nth(1)
    const readme = bottomDiv.locator('a')

    // Check version element
    await expect(version).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+$/)
    console.log('✅ Version element verified')

    // Check separator
    await expect(separator).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(separator).toHaveText(/\|/)
    console.log('✅ Separator element verified')

    // Check README link
    await expect(readme).toHaveClass(
      /text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400/
    )
    await expect(readme).toHaveAttribute(
      'href',
      'https://github.com/klaushofrichter/een-login/blob/develop/README.md'
    )
    console.log('✅ README link verified')
    console.log('✅ Login page test completed successfully')
  })
})
