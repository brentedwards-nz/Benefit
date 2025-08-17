"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
    fallback?: React.ReactNode;
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    requiredRoles = [],
    fallback,
    redirectTo = "/dashboard"
}: ProtectedRouteProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (status === "loading") {
                return;
            }

            if (status === "unauthenticated") {
                // Redirect to signin for unauthenticated users
                router.push("/auth/signin");
                return;
            }

            if (status === "authenticated" && session?.user) {
                const userRoles = session.user.roles || [];

                // SystemAdmin has access to everything
                if (userRoles.includes(UserRole.SystemAdmin)) {
                    setIsAuthorized(true);
                } else if (requiredRoles.length > 0) {
                    // Check if user has any of the required roles
                    const hasRequiredRole = requiredRoles.some(role =>
                        userRoles.includes(role)
                    );
                    setIsAuthorized(hasRequiredRole);
                } else {
                    // No specific roles required, allow access
                    setIsAuthorized(true);
                }
            }

            setIsLoading(false);
        };

        checkAccess();
    }, [session, status, requiredRoles, redirectTo, router]);

    // Handle redirect after authorization state is determined
    useEffect(() => {
        if (!isLoading && !isAuthorized && redirectTo) {
            router.push(redirectTo);
        }
    }, [isLoading, isAuthorized, redirectTo, router]);

    if (isLoading) {
        return (
            <Loading
                title="Checking Access"
                description="Verifying your permissions..."
                size="md"
            />
        );
    }

    if (!isAuthorized) {
        return fallback || null;
    }

    return <>{children}</>;
}

// Convenience components for specific role requirements
export function AdminOnlyRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
    return (
        <ProtectedRoute
            requiredRoles={[UserRole.Admin]}
            fallback={fallback}
            redirectTo={redirectTo}
        >
            {children}
        </ProtectedRoute>
    );
}

export function ClientOnlyRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
    return (
        <ProtectedRoute
            requiredRoles={[UserRole.Client]}
            fallback={fallback}
            redirectTo={redirectTo}
        >
            {children}
        </ProtectedRoute>
    );
}

export function AdminOrClientRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
    return (
        <ProtectedRoute
            requiredRoles={[UserRole.Admin, UserRole.Client]}
            fallback={fallback}
            redirectTo={redirectTo}
        >
            {children}
        </ProtectedRoute>
    );
} 