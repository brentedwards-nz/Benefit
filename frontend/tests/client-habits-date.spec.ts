import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, TestUserRoles } from './utils/test-auth';

test('client habits page shows current month and year in date heading', async ({ page }) => {
  // Set up authenticated user with unique email
  const { user, cleanup } = await setupAuthenticatedUser(page, {
    email: `test-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    firstName: 'Test',
    lastName: 'Client',
    ...TestUserRoles.client()
  });

  try {
    // Navigate to the client habits page
    await page.goto('/dashboard/client/habits');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  
  // Get the current date
  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'short' });
  const currentYear = now.getFullYear().toString();
  const expectedDateText = `${currentMonth} ${currentYear}`;

  // Find the date heading element
  // The date heading is in a div with text-sm font-medium class
  const dateHeading = page.locator('div.text-sm.font-medium').first();

  // Wait for the element to be visible
  await expect(dateHeading).toBeVisible();

  // Check that the date heading contains the current month and year
  await expect(dateHeading).toHaveText(expectedDateText);

  // Additional verification: check that the text matches the expected format
  const actualText = await dateHeading.textContent();
  expect(actualText?.trim()).toBe(expectedDateText);
  
  } finally {
    // Clean up test user
    await cleanup();
  }
});

test('client habits page navigation buttons work correctly', async ({ page }) => {
  // Set up authenticated user with unique email
  const { user, cleanup } = await setupAuthenticatedUser(page, {
    email: `test-client-nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    firstName: 'Test',
    lastName: 'Client',
    ...TestUserRoles.client()
  });

  try {
    // Navigate to the client habits page
    await page.goto('/dashboard/client/habits');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Get the initial date heading
    const initialDateHeading = page.locator('div.text-sm.font-medium').first();
    await expect(initialDateHeading).toBeVisible();
    
    const initialText = await initialDateHeading.textContent();
    console.log(`Initial date heading: ${initialText}`);
    
    // Test that all navigation buttons are visible and enabled
    const prev4WeeksButton = page.locator('button[title="Previous 4 weeks"]');
    const prevWeekButton = page.locator('button[title="Previous week"]');
    const todayButton = page.locator('button:has-text("Today")');
    const nextWeekButton = page.locator('button[title="Next week"]');
    const next4WeeksButton = page.locator('button[title="Next 4 weeks"]');
    
    await expect(prev4WeeksButton).toBeVisible();
    await expect(prevWeekButton).toBeVisible();
    await expect(todayButton).toBeVisible();
    await expect(nextWeekButton).toBeVisible();
    await expect(next4WeeksButton).toBeVisible();
    
    // Test that all buttons are enabled
    await expect(prev4WeeksButton).toBeEnabled();
    await expect(prevWeekButton).toBeEnabled();
    await expect(todayButton).toBeEnabled();
    await expect(nextWeekButton).toBeEnabled();
    await expect(next4WeeksButton).toBeEnabled();
    
    // Click the "Previous 4 weeks" button to go back 4 weeks (more likely to cross month boundary)
    await prev4WeeksButton.click();
    
    // Wait a moment for the state to update
    await page.waitForTimeout(500);
    
    // Check if the date heading changed (it might if we crossed month boundaries)
    const updatedText = await initialDateHeading.textContent();
    console.log(`After Previous 4 weeks: ${updatedText}`);
    
    // Click the "Next 4 weeks" button to go forward 4 weeks
    await next4WeeksButton.click();
    
    // Wait a moment for the state to update
    await page.waitForTimeout(500);
    
    // Check if the date heading changed back
    const finalText = await initialDateHeading.textContent();
    console.log(`After Next 4 weeks: ${finalText}`);
    
    // The heading should be the same as initial (we went back 4 weeks then forward 4 weeks)
    expect(finalText).toBe(initialText);
    
  } finally {
    // Clean up test user
    await cleanup();
  }
});
