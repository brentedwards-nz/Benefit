"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasRouteAccess, UserWithRoles } from "@/lib/auth-utils";
import { Loading } from "@/components/ui/loading";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
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
        // Check if this is a public route
        if (hasRouteAccess(null, pathname)) {
          setIsAuthorized(true);
        } else {
          // Redirect to signin for protected routes
          router.push("/auth/signin");
          return;
        }
      } else if (status === "authenticated" && session?.user) {
        // Get user roles from the session or fetch them
        const userWithRoles: UserWithRoles = {
          id: session.user.id || "",
          email: session.user.email || "",
          roles: session.user.roles || [], // You'll need to add roles to your session
        };

        if (hasRouteAccess(userWithRoles, pathname)) {
          setIsAuthorized(true);
        } else {
          // Redirect to dashboard for unauthorized routes
          router.push("/dashboard");
          return;
        }
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [session, status, pathname, router]);

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
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
} 