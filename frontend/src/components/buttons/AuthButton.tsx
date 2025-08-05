"use client";

import { useAuth } from "@/hooks/use-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (isLoading) {
    return (
      <div className="py-2 px-3 flex rounded-md no-underline bg-btn-background">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? (
    <div className="flex items-center gap-4">
      Hey, {user?.email}!
      <button
        onClick={handleSignOut}
        className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
      >
        Logout
      </button>
    </div>
  ) : (
    <Link
      href="/auth/signin"
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    >
      Login
    </Link>
  );
}
