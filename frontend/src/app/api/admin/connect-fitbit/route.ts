// app/api/admin/connect-fitbit/route.ts
import { NextResponse } from "next/server";

// IMPORTANT: Ensure these environment variables are correctly set.
// These are used to configure the OAuth client for Fitbit.
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;
const FITBIT_REDIRECT_URI =
  process.env.FITBIT_REDIRECT_URI!; // This is your /api/admin/connect-fitbit/callback URL

// Define the scopes needed for your application's Fitbit access
const SCOPES = [
  "activity",
  "heartrate",
  "location",
  "nutrition",
  "profile",
  "settings",
  "sleep",
  "social",
  "weight",
];

export async function GET() {
  if (!FITBIT_CLIENT_ID || !FITBIT_REDIRECT_URI) {
    const redirectUrl = new URL(
      "/dashboard/admin/oauth-settings",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    );
    redirectUrl.searchParams.set("error", "server_config_error");
    redirectUrl.searchParams.set("details", "Missing Fitbit OAuth credentials");
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // Fitbit uses a different authorization URL and query parameters
    const authorizeUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${FITBIT_REDIRECT_URI}&scope=${SCOPES.join(
      " "
    )}&prompt=consent`;

    // Redirect the user's browser directly to Fitbit's OAuth consent screen
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error("Error generating Fitbit OAuth URL:", error);
    const redirectUrl = new URL(
      "/dashboard/admin/oauth-settings",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    );
    redirectUrl.searchParams.set("error", "fitbit_auth_failed");
    redirectUrl.searchParams.set("details", (error as Error).message);
    return NextResponse.redirect(redirectUrl.toString());
  }
}

