import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, TestUserRoles } from './utils/test-auth';

test('debug client habits page', async ({ page }) => {
  // Set up authenticated user with unique email
  const { user, cleanup } = await setupAuthenticatedUser(page, {
    email: `debug-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    firstName: 'Debug',
    lastName: 'User',
    ...TestUserRoles.client()
  });

  try {
    console.log(`Created test user: ${user.email}`);
    
    // Navigate to the client habits page
    await page.goto('/dashboard/client/habits');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-habits-page.png', fullPage: true });
    
    // Log the current URL
    console.log(`Current URL: ${page.url()}`);
    
    // Log the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Log all text content on the page
    const bodyText = await page.locator('body').textContent();
    console.log(`Page content (first 500 chars): ${bodyText?.substring(0, 500)}...`);
    
    // Check if we can find any date-related elements
    const allDivs = await page.locator('div').count();
    console.log(`Total divs on page: ${allDivs}`);
    
    // Look for elements with text-sm class
    const textSmElements = await page.locator('.text-sm').count();
    console.log(`Elements with text-sm class: ${textSmElements}`);
    
    // Look for elements with font-medium class
    const fontMediumElements = await page.locator('.font-medium').count();
    console.log(`Elements with font-medium class: ${fontMediumElements}`);
    
    // Look for elements with both classes
    const targetElements = await page.locator('div.text-sm.font-medium').count();
    console.log(`Elements with both text-sm and font-medium: ${targetElements}`);
    
    // If we find the target elements, log their content
    if (targetElements > 0) {
      const elementTexts = await page.locator('div.text-sm.font-medium').allTextContents();
      console.log(`Content of text-sm font-medium elements:`, elementTexts);
    }
    
    // Look for any date-like text patterns
    const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/;
    const pageContent = await page.content();
    const dateMatches = pageContent.match(datePattern);
    if (dateMatches) {
      console.log(`Found date patterns:`, dateMatches);
    }
    
    // Check if there are any error messages
    const errorElements = await page.locator('[data-testid*="error"], .error, [class*="error"]').count();
    console.log(`Error elements found: ${errorElements}`);
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('[data-testid*="error"], .error, [class*="error"]').allTextContents();
      console.log(`Error messages:`, errorTexts);
    }
    
  } finally {
    // Clean up test user
    await cleanup();
  }
});

