// app/api/admin/connect-fitbit/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Ensure these environment variables are correctly set.
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI!; // This is the URL of the callback file itself!

export async function GET(request: NextRequest) {
  // Check for missing environment variables
  if (!FITBIT_CLIENT_ID || !FITBIT_REDIRECT_URI) {
    console.error("Missing Fitbit OAuth environment variables");
    return NextResponse.json(
      { success: false, message: "Fitbit OAuth credentials not configured" },
      { status: 500 }
    );
  }

  const scope = [
    "activity",
    "heartrate",
    "location",
    "nutrition",
    "profile",
    "settings",
    "sleep",
    "social",
    "weight",
  ].join(" ");

  const authorizationUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${FITBIT_REDIRECT_URI}&scope=${scope}&expires_in=604800`;

  return NextResponse.redirect(authorizationUrl);
}

