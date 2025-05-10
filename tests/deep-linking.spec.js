import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

let loggedBaseURL = false // Flag to ensure baseURL is logged only once

// Helper function to build correct URLs
function buildFullUrl(page, path) {
  const baseURL = page.context()._options.baseURL;
  
  // If we're testing against GitHub Pages
  if (baseURL && baseURL.includes('github.io')) {
    if (baseURL.endsWith('/een-login')) {
      return `${baseURL}${path}`;
    } else if (!baseURL.includes('/een-login/')) {
      return `${baseURL}/een-login${path}`;
    }
  }
  
  // For local development or if baseURL already has the correct structure
  return new URL(path, baseURL).toString();
}

test.describe('Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Log Base URL info once
    if (!loggedBaseURL) {
      const baseURL = page.context()._options.baseURL
      if (baseURL) {
        console.log(`\n🚀 Running tests against Service at URL: ${baseURL}`)
      }
      loggedBaseURL = true
    }
  })

  test('should navigate to settings page after login', async ({ page }) => {
    console.log(`\n▶️ Running Test: ${test.info().title}\n`);
    test.setTimeout(120000)

    // Get credentials
    const username = process.env.TEST_USER
    const password = process.env.TEST_PASSWORD
    test.skip(!username || !password, 'Test credentials not found')

    // Determine environment
    const baseURL = page.context()._options.baseURL;
    const isGitHubPages = baseURL && baseURL.includes('github.io');
    console.log(`🔍 Testing in ${isGitHubPages ? 'GitHub Pages' : 'local'} environment`);

    // APPROACH: Start from root, login first, then navigate to settings
    console.log('🌐 Starting with the app home page');
    const homeUrl = buildFullUrl(page, '/');
    console.log(`📝 Home URL: ${homeUrl}`);
    await page.goto(homeUrl);
    
    // Verify we're on the login page
    await expect(page.getByText('Welcome to EEN Login')).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully loaded the app home page');
    
    // Login through the normal flow
    console.log('🔑 Starting login process');
    const loginButton = page.getByText('Sign in with Eagle Eye Networks');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // Wait for redirect to EEN
    await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 15000 });
    console.log('✅ Redirected to EEN login page');
    
    // Complete the login process - Email
    const emailInput = page.locator('#authentication--input__email');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    console.log('👤 Filling email field');
    await emailInput.fill(username);
    
    // Next button
    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Password
    const passwordInput = page.locator('#authentication--input__password');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    console.log('🔑 Filling password field');
    await passwordInput.fill(password);
    
    // Sign in
    const signInButton = page.locator('#next');
    const signInButtonByText = page.getByRole('button', { name: 'Sign in' });
    await expect(signInButton.or(signInButtonByText)).toBeEnabled({ timeout: 5000 });
    console.log('🔐 Clicking Sign in button');
    try {
      await signInButton.click();
    } catch (error) {
      await signInButtonByText.click();
    }
    
    // After login, expect to land on home page
    const homePattern = isGitHubPages ? /.*\/een-login\/home$/ : /.*\/home$/;
    await page.waitForURL(homePattern, { timeout: 20000 });
    console.log('✅ Successfully logged in and landed on home page');
    
    // Now navigate to settings page using UI navigation
    console.log('🧭 Now navigating to settings page');
    
    // Find the Settings link in the navigation
    // This selector will need to be adjusted based on your actual UI
    const settingsLink = page.getByRole('navigation').getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
    await settingsLink.click();
    
    // Verify we reached settings page
    const settingsPattern = isGitHubPages ? /.*\/een-login\/settings$/ : /.*\/settings$/;
    await page.waitForURL(settingsPattern, { timeout: 10000 });
    console.log('✅ Successfully navigated to Settings page');
    
    // Verify settings page content
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    
    // Test theme switching functionality
    console.log('🎨 Testing theme switching');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Test navigation to an invalid route and back
    if (!isGitHubPages) {
      // Only test invalid route handling in local environment
      const invalidRoute = '/ABCDEFG';
      console.log(`🚫 Navigating to invalid route: ${invalidRoute}`);
      await page.goto(invalidRoute);
      
      // Verify we're on the NotFound page
      await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 10000 });
      console.log('✅ NotFound page displayed correctly');
      
      // Go back to settings
      const backButton = page.getByText('Go Back to Previous Page');
      await expect(backButton).toBeVisible();
      await backButton.click();
      
      // Verify we're back on Settings
      await page.waitForURL(/.*\/settings$/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      console.log('✅ Successfully returned to Settings page');
    } else {
      console.log('⏭️ Skipping invalid route test in GitHub Pages environment');
    }
    
    // Logout to end the test
    console.log('🚪 Starting logout process');
    const logoutButton = page.getByRole('button', { name: 'Logout' });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Verify logout modal and wait for auto-logout
    await expect(page.getByText('Goodbye!')).toBeVisible();
    await expect(page.getByText(/You will be logged out in \d+ seconds/)).toBeVisible();
    
    // Wait for logout to complete
    const rootPattern = isGitHubPages ? /.*\/een-login\/?$/ : /\/?$/;
    await page.waitForURL(rootPattern, { timeout: 15000 });
    console.log('✅ Logout successful, test complete');
  });
});
