import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  clickNavButton,
  logoutFromApplication
} from './utils'
import dotenv from 'dotenv'; // Import dotenv
import fs from 'fs'; // Import fs for file operations
import path from 'path'; // Import path for path manipulation

dotenv.config(); // Load environment variables from .env file

let loggedBaseURL = false // Flag to ensure baseURL is logged only once
let basePath = ''
let consoleLogs = []; // Array to store console logs for each test

// this is used to confirm the user that is logged in
const TEST_USER = process.env.TEST_USER|| 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword'; // Keep password for login utility

// Utility selectors
const selectors = {
  loginEmail: 'input[type="email"]',
  loginPassword: 'input[type="password"]',
  loginButton: 'button:has-text("Login")',
  captureNav: 'a:has-text("Capture")',
  registrationStatus: 'text=/The user .* is (now )?registered/',
  unregisterButton: 'button:has-text("Unregister the user")',
  unregisterModal: 'text=Confirm Unregister',
  cancelButton: 'button:has-text("Cancel")',
  logoutButton: 'button:has-text("Logout")',
  userEmailField: '#user-email', // Added selector for user email field
}

test.describe('Capture Page Registration Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Clear logs and set up listener for each test
    consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Log Base URL and Proxy URL once before the first test runs
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      basePath = ''
      if (baseURL) {
        const url = new URL(baseURL)
        if (url.pathname !== '/') basePath = url.pathname
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using basePath: ${basePath}\n`)
      }
      loggedBaseURL = true // Set flag so it doesn't log again
    }
    // Go to login page and login
    await navigateToLogin(page, basePath)
    await loginToApplication(page, basePath)
  })

  test.afterEach(async ({}, testInfo) => {
    // Save console logs to a file after each test
    // const logFileName = `${testInfo.title.replace(/\s+/g, '-').toLowerCase()}-browser-console.log`;
    const logFileName = `browser-console.log`;
    const logFilePath = path.join(testInfo.outputDir, logFileName);
    const logDir = path.dirname(logFilePath); // Get the directory path

    // Create the directory if it doesn't exist
    fs.mkdirSync(logDir, { recursive: true });

    fs.writeFileSync(logFilePath, consoleLogs.join('\n'));
    console.log(`📚 Browser console logs saved to: ${logFilePath}`);
  });

  test('login, navigate the capture page, check email, logout', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Starting capture page test')

    // Navigate to Capture page
    await clickNavButton(page, 'Capture')
    console.log('✅ Navigated to Capture page')

    // Verify that the displayed email matches TEST_USER environment variable
    console.log(`🔍 Checking displayed email matches TEST_USER: ${TEST_USER}`)
    
    // Wait for the email to actually load - wait for a span that contains the TEST_USER email
    console.log('⏳ Waiting for email to load in the user display...')
    
    // Wait for the email to appear by looking for the blue span containing the email
    const emailSpan = page.locator('p:has-text("Capture and manage your content") span.text-blue-600')
    await expect(emailSpan).toBeVisible({ timeout: 10000 })
    
    // Get the email text content
    const displayedEmail = await emailSpan.textContent()
    console.log(`📧 Found displayed email: ${displayedEmail}`)
    console.log(`📧 Expected email: ${TEST_USER}`)
    
    expect(displayedEmail.trim()).toBe(TEST_USER)
    console.log('✅ Email verification successful - displayed email matches TEST_USER')

    // Wait for captures to load by waiting for either "No captures found" or capture list items
    console.log('⏳ Waiting for captures to load...')
    try {
      // Wait for either captures to appear or "No captures found" message
      await Promise.race([
        page.locator('li[class*="bg-gray-100"]').first().waitFor({ timeout: 5000 }),
        page.locator('text=No captures found').waitFor({ timeout: 5000 })
      ])
    } catch (e) {
      // If neither appears, continue - captures might be loading
      console.log('⚠️ Captures loading state unclear, continuing...')
    }

    // Clean up any existing test captures first
    console.log('🧹 Cleaning up any existing test captures...')
    let existingTestCaptures = page.locator('li:has-text("test title only")')
    let existingCount = await existingTestCaptures.count()
    
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing test capture(s), cleaning up...`)
      
      let deletionCount = 0
      let remainingCount = existingCount
      while (remainingCount > 0 && deletionCount < 10) {
        // Re-check for remaining test captures after each deletion
        existingTestCaptures = page.locator('li:has-text("test title only")')
        remainingCount = await existingTestCaptures.count()
        
        if (remainingCount === 0) {
          console.log('✅ All test captures cleaned up')
          break
        }
        
        deletionCount++
        console.log(`🗑️ Deleting test capture ${deletionCount} (${remainingCount} remaining)`)
        
        // Always target the first remaining capture
        const capture = existingTestCaptures.first()
        const deleteButton = capture.locator('button:has-text("Delete")')
        await deleteButton.click()
        
        // Wait for delete confirmation modal
        const deleteModal = page.locator('h3:has-text("Delete Capture")')
        await expect(deleteModal).toBeVisible()
        
        // Confirm deletion
        const confirmDeleteButton = page.locator('button:has-text("Delete")').last()
        await confirmDeleteButton.click()
        await expect(deleteModal).not.toBeVisible()
        
        // Wait a moment for the list to update
        await page.waitForTimeout(1000)
      }
      
      if (deletionCount >= 10) {
        console.log('⚠️ Too many deletions, breaking to prevent infinite loop')
      }
    }

    // Now check that there are no captures with the title "test title only"
    console.log('🔍 Verifying no test captures remain')
    const remainingTestCaptures = page.locator('li:has-text("test title only")')
    await expect(remainingTestCaptures).toHaveCount(0)
    console.log('✅ Confirmed no existing test capture')

    // Find the "Create New Capture" button on the page
    console.log('🔍 Looking for "Create New Capture" button')
    const createButton = page.locator('button:has-text("Create New Capture")')
    await expect(createButton).toBeVisible()
    console.log('✅ Found "Create New Capture" button')

    // Create a new capture with title "test title only" and description "do not use"
    console.log('📝 Creating new capture with test data')
    await createButton.click()
    
    // Wait for create modal to appear
    const createModal = page.locator('h3:has-text("Create New Capture")')
    await expect(createModal).toBeVisible()
    console.log('✅ Create modal opened')

    // Fill in the form
    await page.fill('input[id="capture-name"]', 'test title only')
    await page.fill('textarea[id="capture-description"]', 'do not use')
    console.log('✅ Filled in capture form')

    // Submit the form
    const createSubmitButton = page.locator('button[type="submit"]:has-text("Create")')
    await createSubmitButton.click()
    
    // Wait for modal to close and capture to be created
    await expect(createModal).not.toBeVisible()
    console.log('✅ Create modal closed - capture created')

    // Check that the new capture is listed on the Capture page
    console.log('🔍 Verifying new capture appears in list')
    const newCaptureCard = page.locator('li:has-text("test title only")')
    await expect(newCaptureCard).toBeVisible({ timeout: 10000 })
    console.log('✅ New capture found in list')

    // Check the title and description on the capture card
    console.log('🔍 Verifying capture card content')
    await expect(newCaptureCard.locator('p:has-text("test title only")')).toBeVisible()
    console.log('✅ Capture title verified on card')

    // Use the delete button on the card
    console.log('🗑️ Testing delete button on card')
    const deleteButtonOnCard = newCaptureCard.locator('button:has-text("Delete")')
    await expect(deleteButtonOnCard).toBeVisible()
    await deleteButtonOnCard.click()
    console.log('✅ Clicked delete button on card')

    // Check that the delete confirmation modal is visible
    console.log('🔍 Verifying delete confirmation modal appears')
    const deleteModal = page.locator('h3:has-text("Delete Capture")')
    await expect(deleteModal).toBeVisible()
    console.log('✅ Delete confirmation modal visible')

    // Cancel the deletion
    console.log('❌ Cancelling deletion')
    const cancelButton = page.locator('button:has-text("Cancel")').last()
    await cancelButton.click()
    await expect(deleteModal).not.toBeVisible()
    console.log('✅ Delete modal closed - deletion cancelled')

    // Check that the test capture is still there
    console.log('🔍 Verifying capture still exists after cancellation')
    await expect(newCaptureCard).toBeVisible()
    console.log('✅ Capture still exists after cancelling delete')

    // Open the modal detail window of the test capture
    console.log('📖 Opening capture detail modal')
    const captureContent = newCaptureCard.locator('div').first()
    await captureContent.click()
    
    const detailModal = page.locator('h3:has-text("Capture Details")')
    await expect(detailModal).toBeVisible()
    console.log('✅ Capture detail modal opened')

    // Check the title and description on the detail modal
    console.log('🔍 Verifying detail modal content')
    // The modal title has specific classes: bg-gray-50 dark:bg-gray-700 p-2 rounded
    const modalContainer = page.locator('div:has(h3:has-text("Capture Details"))')
    const modalTitle = modalContainer.locator('p.bg-gray-50:has-text("test title only")')
    await expect(modalTitle).toBeVisible()
    console.log('✅ Title verified in detail modal')

    // Use the delete button on the modal
    console.log('🗑️ Testing delete button on detail modal')
    const deleteButtonOnModal = page.locator('button:has-text("Delete Capture")')
    await expect(deleteButtonOnModal).toBeVisible()
    await deleteButtonOnModal.click()
    console.log('✅ Clicked delete button on detail modal')

    // Verify delete confirmation modal appears again
    await expect(deleteModal).toBeVisible()
    console.log('✅ Delete confirmation modal appeared again')

    // Confirm the deletion
    console.log('✅ Confirming deletion')
    const confirmDeleteButton = page.locator('button:has-text("Delete")').last()
    await confirmDeleteButton.click()
    await expect(deleteModal).not.toBeVisible()
    console.log('✅ Delete confirmed and modal closed')

    // Check that the test capture is deleted
    console.log('🔍 Verifying capture is deleted')
    await expect(newCaptureCard).not.toBeVisible({ timeout: 10000 })
    console.log('✅ Test capture successfully deleted')

    // Logout and end
    await logoutFromApplication(page)
    console.log('✅ Capture page registration test completed successfully')
  });
}); 