import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, TestUserRoles } from './utils/test-auth';

test('Admin transactions page loads without errors', async ({ page }) => {
  const { user, cleanup } = await setupAuthenticatedUser(page, {
    ...TestUserRoles.admin(),
    email: `admin-trans-test-${Date.now()}@example.com`,
  });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('/dashboard/admin/transactions');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/Transactions/);

    expect(consoleErrors).toEqual([]);

  } finally {
    await cleanup();
  }
});
