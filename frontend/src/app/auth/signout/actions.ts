// src/app/auth/sign-out/actions.ts
"use server"; // Mark this file as a Server Action

import { createClient } from "@/utils/supabase/server"; // Import your server-side Supabase client
import { redirect } from "next/navigation"; // Import Next.js redirect utility

export async function signOut() {
  const supabase = await createClient(); // Get the server-side Supabase client

  // Call the Supabase signOut method
  // This will clear the session cookies set by Supabase
  await supabase.auth.signOut();

  // Redirect the user to a public page after logout
  // This could be the login page, or the homepage
  redirect("/auth/signin"); // Or redirect('/') if you prefer to go to the main homepage
}
