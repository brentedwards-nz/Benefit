"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod"; // Import zod

const emailSchema = z.object({
  email: z
    .email({ message: "Please enter a valid email address." })
    .min(1, { message: "Email is required." }),
});

export type MagicSignInResult = {
  success: boolean;
  message: string;
};

export async function signInWithMagicLink(
  prevState: MagicSignInResult,
  formData: FormData
): Promise<MagicSignInResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const parseResult = emailSchema.safeParse({ email: email });
  if (!parseResult.success) {
    return {
      success: false,
      message: parseResult.error.issues[0].message || "Invalid email format.",
    };
  }

  const baseRedirectToUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
  const emailRedirectToUrl = `${baseRedirectToUrl}?next=/dashboard`;

  const otpOptions = {
    emailRedirectTo: emailRedirectToUrl,
  };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: otpOptions,
  });

  if (error) {
    let userFriendlyMessage = "An unexpected error occurred during sign-in.";

    if (error.message.includes("rate limit")) {
      userFriendlyMessage =
        "Too many sign-in attempts. Please try again in a few minutes.";
    } else if (error.message.includes("Email not confirmed")) {
      userFriendlyMessage =
        "Your email is not confirmed. Please check your inbox for the confirmation link.";
    } else if (error.message.includes("invalid email")) {
      userFriendlyMessage = "The email address is invalid.";
    }

    return {
      success: false,
      message: userFriendlyMessage,
    };
  }

  return {
    success: true,
    message: "Please check your email login link.",
  };
}
