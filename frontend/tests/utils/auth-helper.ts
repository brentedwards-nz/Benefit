import { Page } from '@playwright/test';

/**
 * Mock NextAuth session by setting localStorage and cookies
 * This simulates a logged-in user for testing protected routes
 */
export async function mockAuthSession(page: Page, userData: {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
} = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['Client']
}) {
  // Set localStorage to mock NextAuth session
  await page.addInitScript((userData) => {
    // Mock the session data
    const mockSession = {
      user: userData,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Store in localStorage
    localStorage.setItem('next-auth.session-token', 'mock-session-token');
    localStorage.setItem('next-auth.csrf-token', 'mock-csrf-token');
    
    // Mock the useSession hook by injecting a script
    window.mockSession = mockSession;
  }, userData);

  // Set cookies that NextAuth might expect
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
}

/**
 * Navigate to a protected route with authentication
 */
export async function navigateToProtectedRoute(page: Page, route: string) {
  await mockAuthSession(page);
  await page.goto(route);
  
  // Wait for the page to load and any auth checks to complete
  await page.waitForLoadState('networkidle');
}

