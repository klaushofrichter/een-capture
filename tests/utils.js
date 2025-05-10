/**
 * Helper functions for Playwright tests to work with both local and GitHub Pages environments
 */

/**
 * Determines if we're testing against GitHub Pages
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {boolean} True if we're testing against GitHub Pages
 */
export function isGitHubPagesEnvironment(page) {
  const baseURL = page.context()._options.baseURL;
  return baseURL && baseURL.includes('github.io');
}

/**
 * Builds a URL that works in both local and GitHub Pages environments
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} path - The path to navigate to (e.g. '/settings')
 * @returns {string} The full URL to use
 */
export function buildUrl(page, path) {
  const baseURL = page.context()._options.baseURL;
  
  if (isGitHubPagesEnvironment(page)) {
    // GitHub Pages environment
    if (baseURL.endsWith('/een-login')) {
      return `${baseURL}${path}`;
    } else if (!baseURL.includes('/een-login/')) {
      return `${baseURL}/een-login${path}`;
    }
  }
  
  // Local development or already correct structure
  return new URL(path, baseURL).toString();
}

/**
 * Creates a URL pattern that works in both environments for URL matching
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} pathSuffix - The path ending to match (e.g. '/settings')
 * @returns {RegExp} A regular expression for matching the URL
 */
export function createUrlPattern(page, pathSuffix) {
  if (isGitHubPagesEnvironment(page)) {
    return new RegExp(`.*\/een-login${pathSuffix}$`);
  }
  return new RegExp(`.*${pathSuffix}$`);
}

/**
 * Navigates to the app's home/login page as a starting point
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function navigateToHome(page) {
  const homeUrl = buildUrl(page, '/');
  console.log(`📝 Navigating to Home URL: ${homeUrl}`);
  await page.goto(homeUrl);
}

/**
 * Handles login to the application
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} username - The username to log in with
 * @param {string} password - The password to log in with
 */
export async function loginToApplication(page, username, password) {
  console.log('🔑 Starting login process');
  
  // Find and click login button
  const loginButton = page.getByText('Sign in with Eagle Eye Networks');
  await loginButton.click();
  
  // Wait for redirect to EEN
  await page.waitForURL(/.*eagleeyenetworks.com.*/, { timeout: 15000 });
  console.log('✅ Redirected to EEN login page');
  
  // Fill email
  const emailInput = page.locator('#authentication--input__email');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(username);
  
  // Click next
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Fill password
  const passwordInput = page.locator('#authentication--input__password');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);
  
  // Click sign in
  const signInButton = page.locator('#next');
  const signInButtonByText = page.getByRole('button', { name: 'Sign in' });
  try {
    await signInButton.click();
  } catch (error) {
    await signInButtonByText.click();
  }
  
  // Wait for home page
  const homePattern = createUrlPattern(page, '/home');
  await page.waitForURL(homePattern, { timeout: 20000 });
  console.log('✅ Successfully logged in');
}

/**
 * Logs out of the application
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {boolean} fromMobile - Whether the logout is from the mobile menu
 */
export async function logoutFromApplication(page, fromMobile = false) {
  console.log('🚪 Starting logout process');
  
  if (!fromMobile) {
    // Regular logout flow
    await page.getByRole('button', { name: 'Logout' }).click();
  }
  // If fromMobile is true, we assume the logout button was already clicked
  
  try {
    // Verify logout modal with timeout
    await page.getByText('Goodbye!').waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Logout modal displayed');
    
    // If the OK button is visible, click it for immediate logout
    try {
      const okButton = page.getByRole('button', { name: 'OK' });
      if (await okButton.isVisible({ timeout: 2000 })) {
        await okButton.click();
        console.log('👆 Clicked OK button to speed up logout');
      }
    } catch (e) {
      // OK button might not be available, continue with auto-logout
      console.log('⏳ Waiting for auto-logout');
    }
  } catch (e) {
    console.log('⚠️ Logout modal not displayed or already closed, continuing');
  }
  
  // Wait for logout to complete
  const rootPattern = isGitHubPagesEnvironment(page) 
    ? /.*\/een-login\/?$/ 
    : /\/?$/;
  await page.waitForURL(rootPattern, { timeout: 15000 });
  console.log('✅ Logout successful');
} 