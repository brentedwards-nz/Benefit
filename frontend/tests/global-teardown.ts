import { FullConfig } from '@playwright/test';
import { cleanupAllTestUsers } from './utils/test-auth';

async function globalTeardown(config: FullConfig) {
  // Clean up all test users after tests complete
  console.log('Cleaning up test users...');
  await cleanupAllTestUsers();
  console.log('Global teardown complete');
}

export default globalTeardown;

