"use client"; // This component needs to be a client component because it handles user interaction

import { Button } from "@/components/ui/button"; // Assuming you have a UI Button component
import { LogOutIcon } from "lucide-react"; // Or any other icon you prefer
import { signOutAction } from "@/app/auth/signout/actions"; // Import your server action

export default function HomeButton() {
  return (
    // The form's 'action' prop directly references your server action.
    // When this form is submitted (e.g., by clicking the button),
    // the 'signOutAction' server action will be executed on the server.
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="icon">
        <LogOutIcon className="h-4 w-4" /> {/* Adjust icon size if needed */}
        <span className="sr-only">Sign Out</span> {/* For accessibility */}
      </Button>
    </form>
  );
}
