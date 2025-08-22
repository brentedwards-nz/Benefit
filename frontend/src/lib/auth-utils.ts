import { UserRole } from "@prisma/client";

export interface UserWithRoles {
  id: string;
  email: string;
  roles: UserRole[];
}

/**
 * Check if a user has access to a specific route
 * @param user - User object with roles
 * @param route - Route path to check access for
 * @returns boolean indicating if access is allowed
 */
export function hasRouteAccess(user: UserWithRoles | null, route: string): boolean {
  // No user means no access (except for public routes)
  if (!user) {
    return isPublicRoute(route);
  }

  // SystemAdmin has access to everything
  if (user.roles.includes(UserRole.SystemAdmin)) {
    return true;
  }

  // Check route-specific permissions
  if (route.startsWith('/dashboard/admin/')) {
    // Admin routes require Admin or SystemAdmin role
    return user.roles.includes(UserRole.Admin);
  }

  if (route.startsWith('/dashboard/client/')) {
    // Client routes require Client, Admin, or SystemAdmin role
    return user.roles.includes(UserRole.Client) || user.roles.includes(UserRole.Admin);
  }

  // Dashboard root and other routes are accessible to all authenticated users
  if (route.startsWith('/dashboard')) {
    return true;
  }

  // Public routes are accessible to everyone
  if (isPublicRoute(route)) {
    return true;
  }

  // Default: deny access
  return false;
}

/**
 * Check if a route is public (no authentication required)
 * @param route - Route path to check
 * @returns boolean indicating if route is public
 */
export function isPublicRoute(route: string): boolean {
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signout',
    '/auth/error',
    '/auth/verify-request',
    '/api/auth/[...nextauth]',
  ];

  return publicRoutes.some(publicRoute => route === publicRoute || route.startsWith(publicRoute));
}

/**
 * Get the highest role for a user
 * @param user - User object with roles
 * @returns The highest priority role
 */
export function getHighestRole(user: UserWithRoles | null): UserRole | null {
  if (!user || !user.roles.length) {
    return null;
  }

  const rolePriority = {
    [UserRole.SystemAdmin]: 4,
    [UserRole.Trainer]: 3,
    [UserRole.Admin]: 2,
    [UserRole.Client]: 1,
  };

  return user.roles.reduce((highest, current) => {
    return rolePriority[current] > rolePriority[highest] ? current : highest;
  });
}

/**
 * Check if user has a specific role
 * @param user - User object with roles
 * @param role - Role to check for
 * @returns boolean indicating if user has the role
 */
export function hasRole(user: UserWithRoles | null, role: UserRole): boolean {
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if user has any of the specified roles
 * @param user - User object with roles
 * @param roles - Array of roles to check for
 * @returns boolean indicating if user has any of the roles
 */
export function hasAnyRole(user: UserWithRoles | null, roles: UserRole[]): boolean {
  return user?.roles.some(role => roles.includes(role)) ?? false;
} 