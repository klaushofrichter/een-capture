import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

test.describe('Direct Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
  })

  test('direct page should have correct elements and consistent styling', async ({ page }) => {
    // Navigate directly to the direct page
    await page.goto('/direct')

    // Check if we're on the direct page
    await expect(page.getByRole('heading', { name: /Direct Access to EEN Login/ })).toBeVisible()

    // Check for form elements
    await expect(page.getByLabel('Access Token')).toBeVisible()
    await expect(page.getByLabel('Base URL')).toBeVisible()
    await expect(page.getByLabel('Port')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible()

    // Check bottom elements styling
    const bottomDiv = page.locator('.absolute.bottom-4')
    await expect(bottomDiv).toBeVisible()

    // Get all text elements in the bottom div
    const version = bottomDiv.locator('span').first()
    const separator = bottomDiv.locator('span').nth(1)
    const readme = bottomDiv.locator('a')

    // Check version element
    await expect(version).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+$/)

    // Check separator
    await expect(separator).toHaveClass(/text-gray-400 dark:text-gray-500/)
    await expect(separator).toHaveText(/\|/)

    // Check README link
    await expect(readme).toHaveClass(
      /text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400/
    )
    await expect(readme).toHaveAttribute(
      'href',
      'https://github.com/klaushofrichter/een-login/blob/develop/README.md'
    )
  })
}) 