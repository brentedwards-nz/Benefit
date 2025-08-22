import { Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { encode } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  roles: UserRole[];
  authId?: string;
}

/**
 * Creates a test user in the database with the specified roles
 */
export async function createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
  const testUser: TestUser = {
    id: randomUUID(),
    email: userData.email || `test-${randomUUID()}@example.com`,
    firstName: userData.firstName || 'Test',
    lastName: userData.lastName || 'User',
    roles: userData.roles || ['Client'],
    ...userData
  };

  try {
    // First create a NextAuth User record
    const authUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName || ''}`.trim(),
        emailVerified: new Date(),
      }
    });

    testUser.authId = authUser.id;

    // Then create the Client record linked to the auth user
    await prisma.client.create({
      data: {
        id: testUser.id,
        authId: authUser.id,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        current: true,
        disabled: false,
        roles: testUser.roles.map((role) => Object.values(UserRole).find((enumValue) => enumValue === role)).filter((role): role is UserRole => role !== undefined),
        contactInfo: [
          {
            type: "email",
            value: testUser.email,
            primary: true,
            label: "Primary Email"
          }
        ]
      }
    });

    console.log(`Created test user: ${testUser.email} with roles: ${testUser.roles.join(', ')}`);
    return testUser;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Cleans up test users from the database
 */
export async function cleanupTestUser(userEmail: string): Promise<void> {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (user) {
      // Delete the client record
      await prisma.client.deleteMany({
        where: { authId: user.id }
      });

      // Delete accounts linked to this user
      await prisma.account.deleteMany({
        where: { userId: user.id }
      });

      // Delete sessions
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });

      // Finally delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });

      console.log(`Cleaned up test user: ${userEmail}`);
    }
  } catch (error) {
    console.error('Error cleaning up test user:', error);
    // Don't throw - cleanup should be best effort
  }
}

/**
 * Creates a valid NextAuth JWT token for a user
 */
export async function createSessionToken(user: TestUser): Promise<string> {
  if (!user.authId) {
    throw new Error('User must have authId to create session token');
  }

  // Get the NEXTAUTH_SECRET from environment
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
  }

  // Create a proper NextAuth JWT token
  const token = await encode({
    token: {
      id: user.authId,
      sub: user.authId,
      email: user.email,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      picture: null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      jti: randomUUID(),
    },
    secret,
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return token;
}

/**
 * Authenticates a user in Playwright by setting the JWT token cookie
 */
export async function authenticateUser(page: Page, user: TestUser): Promise<void> {
  if (!user.authId) {
    throw new Error('User must have authId to authenticate');
  }

  // Create a JWT token
  const jwtToken = await createSessionToken(user);

  // Set the JWT token as a cookie that NextAuth can read
  // NextAuth expects the token in the 'next-auth.session-token' cookie
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: jwtToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false, // NextAuth needs to read this
      secure: false,
      sameSite: 'Lax'
    }
  ]);

  // Also set the CSRF token that NextAuth might expect
  await page.context().addCookies([
    {
      name: 'next-auth.csrf-token',
      value: randomUUID(),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);

  console.log(`Authenticated user: ${user.email} with JWT token`);
}

/**
 * Alternative authentication method: Inject session data directly into browser context
 * This bypasses cookie issues and directly mocks the NextAuth session
 */
export async function authenticateUserWithInjection(page: Page, user: TestUser): Promise<void> {
  if (!user.authId) {
    throw new Error('User must have authId to authenticate');
  }

  // Inject a mock NextAuth session directly into the browser context
  await page.addInitScript((userData) => {
    // Mock the useSession hook
    const mockSession = {
      data: {
        user: {
          id: userData.authId,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName || ''}`.trim(),
          image: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated'
    };

    // Override the useSession hook
    if (typeof window !== 'undefined') {
      window.mockNextAuthSession = mockSession;
      
      // Also try to override the session API endpoint
      const originalFetch = window.fetch;
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === 'string' && input.includes('/api/auth/session')) {
          return Promise.resolve(new Response(JSON.stringify(mockSession), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch.call(this, input, init);
      };
    }
  }, user);

  console.log(`Authenticated user: ${user.email} with session injection`);
}

/**
 * Full authentication flow: create user, authenticate, and return cleanup function
 */
export async function setupAuthenticatedUser(
  page: Page, 
  userData: Partial<TestUser> = {}
): Promise<{ user: TestUser; cleanup: () => Promise<void> }> {
  const user = await createTestUser(userData);
  
  try {
    // Try the JWT token method first
    await authenticateUser(page, user);
  } catch (error) {
    console.log('JWT authentication failed, falling back to session injection:', error);
    // Fall back to session injection if JWT fails
    await authenticateUserWithInjection(page, user);
  }

  const cleanup = async () => {
    await cleanupTestUser(user.email);
  };

  return { user, cleanup };
}

/**
 * Creates a test user with specific roles for different test scenarios
 */
export const TestUserRoles = {
  client: () => ({ roles: [UserRole.Client] }),
  admin: () => ({ roles: [UserRole.Admin, UserRole.Client] }),
  systemAdmin: () => ({ roles: [UserRole.SystemAdmin, UserRole.Admin, UserRole.Client] }),
  trainer: () => ({ roles: [UserRole.Trainer, UserRole.Client] }),
} as const;

/**
 * Cleanup all test users (for test teardown)
 */
export async function cleanupAllTestUsers(): Promise<void> {
  try {
    // Delete all users with test emails
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test-' } },
          { email: { contains: '@example.com' } }
        ]
      }
    });

    for (const user of testUsers) {
      if (user.email) {
        await cleanupTestUser(user.email);
      }
    }

    console.log(`Cleaned up ${testUsers.length} test users`);
  } catch (error) {
    console.error('Error cleaning up all test users:', error);
  }
}
