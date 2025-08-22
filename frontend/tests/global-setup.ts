import { FullConfig } from '@playwright/test';
import { cleanupAllTestUsers } from './utils/test-auth';

async function globalSetup(config: FullConfig) {
  // Clean up any existing test users before starting
  console.log('Cleaning up existing test users...');
  await cleanupAllTestUsers();
  console.log('Global setup complete');
}

export default globalSetup;

