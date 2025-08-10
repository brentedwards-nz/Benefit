"use client"; // This component needs to be a client component because it handles user interaction

import { Button } from "@/components/ui/button"; // Assuming you have a UI Button component
import { LogOutIcon } from "lucide-react"; // Or any other icon you prefer
import { signOut } from "next-auth/react"; // Use client-side signOut

export default function HomeButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <Button onClick={handleSignOut} variant="ghost" size="icon">
      <LogOutIcon className="h-4 w-4" /> {/* Adjust icon size if needed */}
      <span className="sr-only">Sign Out</span> {/* For accessibility */}
    </Button>
  );
}
