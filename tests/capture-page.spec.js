import { test, expect } from '@playwright/test'
import {
  navigateToLogin,
  loginToApplication,
  clickNavButton,
  logoutFromApplication,
  MAX_TEST_TIMEOUT
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
//const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword'; // Keep password for login utility
const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic

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
      const redirectUri = process.env.VITE_REDIRECT_URI || 'http://127.0.0.1:3333'
      const configuredProxyUrl = process.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333' // Default logic
      basePath = ''
      if (baseURL) {
        const url = new URL(baseURL)
        if (url.pathname !== '/') basePath = url.pathname
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
        console.log(`🔒 Using Auth Proxy URL: ${configuredProxyUrl}`)
        console.log(`🔒 Using Redirect URI: ${redirectUri}`)
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
    test.setTimeout(MAX_TEST_TIMEOUT) // max 40 seconds overall

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
        await expect(deleteModal).toBeHidden()
        
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
    
    // Fill in camera ID
    await page.fill('input[id="camera-id"]', '1005963a')
    console.log('✅ Filled in camera ID: 1005963a')
    
    // Calculate a safe past date (2 days ago) to ensure end time is not in future
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 2) // 2 days ago to be safe
    pastDate.setHours(10, 0, 0, 0) // Set to 10:00 AM for consistency
    const pastDateString = pastDate.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
    
    // Fill in start date (2 days ago)
    await page.fill('input[id="start-date-picker"]', pastDateString)
    console.log(`✅ Filled in start date: ${pastDateString}`)
    
    console.log('✅ Filled in complete capture form')

    // Scroll the modal content to ensure the Create button is visible
    console.log('Scrolling modal content to show Create button...');
    await page.evaluate(() => {
      const modal = document.querySelector('div[class*="max-h-[90vh]"][class*="overflow-y-auto"]');
      if (modal) {
        modal.scrollTo(0, modal.scrollHeight);
      }
    });
    console.log('Scrolled modal content to bottom.');

    // Wait for form validation to complete and button to be enabled
    console.log('⏳ Waiting for form validation and Create button to be enabled...')
    
    // Give time for all form validation to complete
    await page.waitForTimeout(3000)
    
    const createSubmitButton = page.locator('button:has-text("Create"):not(:has-text("New"))')
    console.log('🔍 Checking Create button state...')
    
    // Submit the form (force click since button appears enabled but may have disabled attribute due to Vue reactivity timing)
    await createSubmitButton.click({ force: true })
    console.log('✅ Clicked Create button')
    
    // Wait for modal to close and capture to be created (longer timeout for form processing)
    await expect(createModal).toBeHidden({ timeout: 15000 })
    console.log('✅ Create modal closed - capture created')

    // Check that the new capture is listed on the Capture page
    console.log('🔍 Verifying new capture appears in list')
    
    // Wait for the capture count to increase (indicating the list has been updated)
    console.log('⏳ Waiting for capture list to update with new capture...')
    
    // Get the initial count of captures
    const captureList = page.locator('ul.space-y-2 li')
    await captureList.first().waitFor({ state: 'visible', timeout: 15000 })
    
    // Wait for Vue.js reactivity and DOM updates to complete
    console.log('⏳ Waiting for Vue.js reactivity to complete...')
    await page.waitForTimeout(3000)
    
    // Log current capture count for debugging
    const currentCount = await captureList.count()
    console.log(`📊 Current capture count: ${currentCount}`)
    
    // Debug: Log all capture names currently in the list
    console.log('🔍 Debugging: Current captures in list:')
    for (let i = 0; i < currentCount; i++) {
      const captureCard = captureList.nth(i)
      const nameElement = captureCard.locator('p.text-sm.font-medium')
      try {
        const captureName = await nameElement.textContent()
        console.log(`  ${i + 1}. "${captureName}"`)
      } catch (e) {
        console.log(`  ${i + 1}. [Could not read capture name]`)
      }
    }
    
    // Look for the specific capture we just created - it should now show the full name
    console.log('🔍 Looking for "test title only" capture...')
    const newCaptureCard = page.locator('li:has-text("test title only")')
    
    // Wait up to 10 seconds for the new capture to appear
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
    console.log('✅ Cancelling deletion')
    const cancelButton = page.locator('button:has-text("Cancel")').last()
    await cancelButton.click()
    await expect(deleteModal).toBeHidden()
    console.log('✅ Delete modal closed - deletion cancelled')

    // Check that the test capture is still there
    console.log('🔍 Verifying capture still exists after cancellation')
    await expect(newCaptureCard).toBeVisible()
    console.log('✅ Capture still exists after cancelling delete')

    // Open the modal detail window of the test capture
    console.log('📖 Opening capture detail modal')
    const captureContent = newCaptureCard.locator('div.cursor-pointer')
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
    await expect(deleteModal).toBeHidden()
    console.log('✅ Delete confirmed and modal closed')

    // Check that the test capture is deleted
    console.log('🔍 Verifying capture is deleted')
    await expect(newCaptureCard).not.toBeVisible({ timeout: 10000 })
    console.log('✅ Test capture successfully deleted')

    // Logout and end
    await logoutFromApplication(page)
    console.log('✅ Capture page registration test completed successfully')
  });

  test('ESC key closes modals', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`)
    console.log('🔍 Testing ESC key functionality on modals')

    // Navigate to Capture page
    await clickNavButton(page, 'Capture')
    console.log('✅ Navigated to Capture page')

    // Clean up any existing ESC test captures first
    console.log('🧹 Cleaning up any existing ESC test captures...')
    
    // Wait for captures to load by waiting for either "No captures found" or capture list items
    try {
      await Promise.race([
        page.locator('li[class*="bg-gray-100"]').first().waitFor({ timeout: 5000 }),
        page.locator('text=No captures found').waitFor({ timeout: 5000 })
      ])
    } catch (e) {
      console.log('⚠️ Captures loading state unclear, continuing...')
    }

    let existingEscCaptures = page.locator('li:has-text("ESC test capture")')
    let existingCount = await existingEscCaptures.count()
    
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing ESC test capture(s), cleaning up...`)
      
      let deletionCount = 0
      let remainingCount = existingCount
      while (remainingCount > 0 && deletionCount < 10) {
        // Re-check for remaining test captures after each deletion
        existingEscCaptures = page.locator('li:has-text("ESC test capture")')
        remainingCount = await existingEscCaptures.count()
        
        if (remainingCount === 0) {
          console.log('✅ All ESC test captures cleaned up')
          break
        }
        
        deletionCount++
        console.log(`🗑️ Deleting ESC test capture ${deletionCount} (${remainingCount} remaining)`)
        
        // Always target the first remaining capture
        const capture = existingEscCaptures.first()
        const deleteButton = capture.locator('button:has-text("Delete")')
        await deleteButton.click()
        
        // Wait for delete confirmation modal
        const deleteModal = page.locator('h3:has-text("Delete Capture")')
        await expect(deleteModal).toBeVisible()
        
        // Confirm deletion
        const confirmDeleteButton = page.locator('button:has-text("Delete")').last()
        await confirmDeleteButton.click()
        await expect(deleteModal).toBeHidden()
        
        // Wait a moment for the list to update
        await page.waitForTimeout(1000)
      }
      
      if (deletionCount >= 10) {
        console.log('⚠️ Too many deletions, breaking to prevent infinite loop')
      }
    }

    // Now check that there are no captures with the title "ESC test capture"
    console.log('🔍 Verifying no ESC test captures remain')
    const remainingEscCaptures = page.locator('li:has-text("ESC test capture")')
    await expect(remainingEscCaptures).toHaveCount(0)
    console.log('✅ Confirmed no existing ESC test capture')

    // Test ESC key on Create Modal
    console.log('🔍 Testing ESC key on Create New Capture modal')
    const createButton = page.locator('button:has-text("Create New Capture")')
    await createButton.click()
    
    const createModal = page.locator('h3:has-text("Create New Capture")')
    await expect(createModal).toBeVisible()
    console.log('✅ Create modal opened')

    // Press ESC key
    await page.keyboard.press('Escape')
    await expect(createModal).toBeHidden()
    console.log('✅ ESC key closed Create modal')

    // Create a test capture for modal testing
    console.log('📝 Creating a test capture for modal testing')
    await createButton.click()
    await page.fill('input[id="capture-name"]', 'ESC test capture')
    await page.fill('textarea[id="capture-description"]', 'Testing ESC functionality')
    
    // Fill in camera ID
    await page.fill('input[id="camera-id"]', '1005963a')
    
    // Calculate a safe past date (2 days ago) to ensure end time is not in future
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 2) // 2 days ago to be safe
    pastDate.setHours(10, 0, 0, 0) // Set to 10:00 AM for consistency
    const pastDateString = pastDate.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
    
    // Fill in start date (2 days ago)
    await page.fill('input[id="start-date-picker"]', pastDateString)
    
    // Wait for form validation to complete and button to be enabled
    console.log('⏳ Waiting for form validation and Create button to be enabled...')
    
    // Give time for all form validation to complete
    await page.waitForTimeout(3000)
    
    const createSubmitButton = page.locator('button:has-text("Create"):not(:has-text("New"))')
    console.log('🔍 Checking Create button state...')
    
    await createSubmitButton.click({ force: true })
    console.log('✅ Clicked Create button')
    await expect(createModal).toBeHidden({ timeout: 15000 })
    console.log('✅ Test capture created')

    // Test ESC key on Detail Modal
    console.log('🔍 Testing ESC key on Capture Detail modal')
    const testCaptureCard = page.locator('li:has-text("ESC test capture")')
    await expect(testCaptureCard).toBeVisible()
    
    const captureContent = testCaptureCard.locator('div.cursor-pointer')
    await captureContent.click()
    
    const detailModal = page.locator('h3:has-text("Capture Details")')
    await expect(detailModal).toBeVisible()
    console.log('✅ Detail modal opened')

    // Press ESC key
    await page.keyboard.press('Escape')
    await expect(detailModal).toBeHidden()
    console.log('✅ ESC key closed Detail modal')

    // Test ESC key on Delete Confirmation Modal
    console.log('🔍 Testing ESC key on Delete Confirmation modal')
    const deleteButtonOnCard = testCaptureCard.locator('button:has-text("Delete")')
    await deleteButtonOnCard.click()
    
    const deleteModal = page.locator('h3:has-text("Delete Capture")')
    await expect(deleteModal).toBeVisible()
    console.log('✅ Delete confirmation modal opened')

    // Press ESC key
    await page.keyboard.press('Escape')
    await expect(deleteModal).toBeHidden()
    console.log('✅ ESC key closed Delete confirmation modal')

    // Clean up the test capture
    console.log('🧹 Cleaning up test capture')
    await deleteButtonOnCard.click()
    await expect(deleteModal).toBeVisible()
    const confirmDeleteButton = page.locator('button:has-text("Delete")').last()
    await confirmDeleteButton.click()
    await expect(deleteModal).toBeHidden()
    await expect(testCaptureCard).toBeHidden()
    console.log('✅ Test capture cleaned up')

    // Logout and end
    await logoutFromApplication(page)
    console.log('✅ ESC key functionality test completed successfully')
  });
}); 