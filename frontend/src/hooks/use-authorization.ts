import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

export interface UserWithRoles {
    id: string;
    email: string;
    roles: UserRole[];
}

export function useAuthorization() {
    const { data: session } = useSession();

    const user: UserWithRoles | null = session?.user ? {
        id: session.user.id || "",
        email: session.user.email || "",
        roles: session.user.roles || []
    } : null;

    const hasRole = (role: UserRole): boolean => {
        return user?.roles.includes(role) ?? false;
    };

    const hasAnyRole = (roles: UserRole[]): boolean => {
        return user?.roles.some(role => roles.includes(role)) ?? false;
    };

    const hasAllRoles = (roles: UserRole[]): boolean => {
        return user?.roles.every(role => roles.includes(role)) ?? false;
    };

    const isSystemAdmin = (): boolean => hasRole(UserRole.SystemAdmin);
    const isAdmin = (): boolean => hasRole(UserRole.Admin);
    const isClient = (): boolean => hasRole(UserRole.Client);

    const canAccessAdminRoutes = (): boolean => {
        return isSystemAdmin() || isAdmin();
    };

    const canAccessClientRoutes = (): boolean => {
        return isSystemAdmin() || isAdmin() || isClient();
    };

    const getHighestRole = (): UserRole | null => {
        if (!user?.roles.length) return null;

        const rolePriority: Record<UserRole, number> = {
            [UserRole.SystemAdmin]: 4,
            [UserRole.Trainer]: 3,
            [UserRole.Admin]: 2,
            [UserRole.Client]: 1,
        };

        return user.roles.reduce((highest, current) => {
            return rolePriority[current] > rolePriority[highest] ? current : highest;
        });
    };

    return {
        user,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isSystemAdmin,
        isAdmin,
        isClient,
        canAccessAdminRoutes,
        canAccessClientRoutes,
        getHighestRole,
    };
} 