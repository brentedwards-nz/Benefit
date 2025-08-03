// app/api/admin/connect-gmail/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

// IMPORTANT: Ensure these environment variables are correctly set.
// These are used to configure the OAuth client for Google.
const GOOGLE_GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID!;
const GOOGLE_GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET!;
const GOOGLE_GMAIL_CLIENT_REDIRECT_URI =
  process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!; // This is your /api/admin/connect-gmail/callback URL

// Define the scopes needed for your application's Gmail access
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

// Initialize the OAuth2 client outside the handler for better performance
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_GMAIL_CLIENT_ID,
  GOOGLE_GMAIL_CLIENT_SECRET,
  GOOGLE_GMAIL_CLIENT_REDIRECT_URI
);

export async function GET() {
  if (
    !GOOGLE_GMAIL_CLIENT_ID ||
    !GOOGLE_GMAIL_CLIENT_SECRET ||
    !GOOGLE_GMAIL_CLIENT_REDIRECT_URI
  ) {
    // It's good practice to redirect with an absolute URL if an error occurs here
    const redirectUrl = new URL(
      "/admin/settings",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    );
    redirectUrl.searchParams.set("error", "server_config_error");
    redirectUrl.searchParams.set("details", "Missing Google OAuth credentials");
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // Generate the URL that will be used for the Google consent dialog.
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Request a refresh token for long-term access
      scope: SCOPES,
      prompt: "consent", // Force user to re-consent, ensures refresh token on initial authorization
    });

    // Redirect the user's browser directly to Google's OAuth consent screen
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    const redirectUrl = new URL(
      "/admin/settings",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    );
    redirectUrl.searchParams.set("error", "gmail_auth_failed");
    redirectUrl.searchParams.set("details", (error as Error).message);
    return NextResponse.redirect(redirectUrl.toString());
  }
}
