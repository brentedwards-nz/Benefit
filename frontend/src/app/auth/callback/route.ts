// File: src/app/auth/callback/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Your server-side Supabase client

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code"); // <-- Correctly get the 'code' parameter

  // The 'next' path to redirect to after successful login (defaults to '/')
  const next = requestUrl.searchParams.get("next") ?? "/";

  //console.log("auth/callback route called next:", next); // This log is fine

  console.log("---------------------------------------");
  console.log(" - app/auth/callback/route.ts");
  console.log(" - code:" + code);
  console.log("---------------------------------------");

  if (code) {
    // Check if the 'code' parameter exists
    const supabase = await createClient();

    // --- IMPORTANT CHANGE: Use exchangeCodeForSession for magic links ---
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // --- END IMPORTANT CHANGE ---

    if (!error) {
      // Success! Redirect to the 'next' path.
      // NextResponse.redirect handles setting cookies on the response before the redirect.
      const redirectUrl = requestUrl.origin + next;
      return NextResponse.redirect(redirectUrl);
    } else {
      // Log the actual error from exchangeCodeForSession
      console.error("Supabase exchangeCodeForSession error:", error.message);
      // If there's an error in exchanging the code, redirect to error page.
      const errorUrl =
        requestUrl.origin +
        "/error?message=" +
        encodeURIComponent(error.message || "Could not log you in.");
      return NextResponse.redirect(errorUrl);
    }
  }

  // If no 'code' parameter was found in the URL, something is wrong.
  const errorUrl =
    requestUrl.origin + "/error?message=No authentication code provided.";
  return NextResponse.redirect(errorUrl);
}
