// File: src/app/magic/page.tsx (or wherever your Magic component lives)

"use client"; // This file is a client component

import Link from "next/link";
import { SubmitButton } from "./submit-button"; // Assuming SubmitButton is a client component
import { magicSignIn } from "./actions"; // Your modified server action
import { useFormState } from "react-dom"; // Import the useFormState hook
import { useFormStatus } from "react-dom"; // Import the useFormStatus hook
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconMail,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// No longer need searchParams for form messages directly
export default function Magic() {
  // Define the initial state for your form.
  // This is what `useFormState` will start with before any submissions.
  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = useFormState(magicSignIn, initialState);
  const { pending } = useFormStatus();
  const isDisabled = pending || state.success;

  // --- REFACTORED: Single function to handle all OAuth sign-ins ---
  // We explicitly define allowed providers for better type safety.
  // Make sure these match the string literals expected by Supabase.
  type OAuthProvider = "google" | "facebook";

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider, // Use the passed provider string
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error(`Error with ${provider} sign-in:`, error.message);
      alert(`${provider} sign-in error: ${error.message}`);
    }
  };
  // --- END REFACTORED ---

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-8">
      <form
        className="animate-in flex flex-col w-full justify-center gap-2 text-foreground"
        action={formAction} // <--- IMPORTANT: Use the formAction from useFormState
      >
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-gradient-x">
            Sign In
          </h1>
        </div>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email" // Ensure the name attribute matches what magicSignIn expects (formData.get("email"))
          placeholder="you@example.com"
          required
          disabled={isDisabled} // Use the pending state from useFormState
        />
        <SubmitButton
          className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="Signing In..."
          disabled={isDisabled} // Use the pending state from useFormState
        />

        {state?.message && ( // Check if there's a message in the state
          <p
            className={`mt-4 p-4 text-center rounded-md ${
              state.success // Use the success property from the state to determine color
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <hr className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center uppercase">
          <span className="bg-white px-2 text-sm text-gray-500">
            Or continue with
          </span>
        </div>
      </div>
      <div className="space-x-2 flex justify-center">
        <Button
          className="w-1/2"
          variant="outline"
          onClick={handleOAuthSignIn.bind(null, "google")} // Bind the provider to the function
          disabled={isDisabled} // Disable if already pending or successful
        >
          <IconBrandGoogle />
          Google
        </Button>
        <Button
          className="w-1/2"
          variant="outline"
          onClick={handleOAuthSignIn.bind(null, "facebook")} // Bind the provider to the function
          disabled={isDisabled} // Disable if already pending or successful
        >
          <IconBrandFacebook />
          Facebook
        </Button>
      </div>
      <div className="space-x-2 flex justify-center">
        <Link href={"/"}>Home</Link>
      </div>
    </div>
  );
}
