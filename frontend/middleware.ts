import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to root route and login for all users
    if (pathname === "/" || pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Get user roles from token
    const userRoles = token.roles as UserRole[] || [];

    // SystemAdmin has access to everything
    if (userRoles.includes(UserRole.SystemAdmin)) {
      return NextResponse.next();
    }

    // Admin routes require Admin or SystemAdmin role
    if (pathname.startsWith("/dashboard/admin/")) {
      if (!userRoles.includes(UserRole.Admin)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Client routes require Client, Admin, or SystemAdmin role
    if (pathname.startsWith("/dashboard/client/")) {
      if (!userRoles.includes(UserRole.Client) && !userRoles.includes(UserRole.Admin)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // AI routes require SystemAdmin role only
    if (pathname.startsWith("/dashboard/ai/")) {
      if (!userRoles.includes(UserRole.SystemAdmin)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Allow access to dashboard root for all authenticated users
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/profile/:path*",
  ],
};
