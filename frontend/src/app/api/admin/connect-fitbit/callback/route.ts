// app/api/admin/connect-fitbit/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { encrypt } from '@/lib/encryption';

// Ensure these environment variables are correctly set.
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI!;

// Helper for consistent redirects
const redirectToOAuthSettingsError = (
  errorType: string,
  details?: string
) => {
  const url = new URL("/dashboard/admin/oauth-settings", new URL(FITBIT_REDIRECT_URI).origin);
  url.searchParams.set("error", errorType);
  if (details) {
    url.searchParams.set("details", details);
  }
  return NextResponse.redirect(url.toString());
};

export async function GET(request: NextRequest) {
  // Validate environment variables
  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET || !FITBIT_REDIRECT_URI) {
    console.error("Missing Fitbit OAuth environment variables");
    return redirectToOAuthSettingsError("missing_env_vars", "Fitbit OAuth credentials not configured");
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code"); // Authorization code from Fitbit
  const errorParam = searchParams.get("error"); // Error from Fitbit if authorization failed

  // 1. Handle errors from Fitbit's redirect (e.g., user denied access)
  if (errorParam) {
    console.error("Fitbit OAuth Error:", errorParam);
    return redirectToOAuthSettingsError("fitbit_auth_denied", errorParam);
  }

  // 2. Check if an authorization code was received
  if (!code) {
    console.error("No authorization code found in Fitbit callback.");
    return redirectToOAuthSettingsError("no_auth_code");
  }

  try {
    // 3. Exchange the authorization code for access and refresh tokens
    const params = new URLSearchParams();
    params.append("client_id", FITBIT_CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", FITBIT_REDIRECT_URI);
    params.append("code", code);

    const authString = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");

    const tokenResponse = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Error exchanging Fitbit code for tokens:", tokens);
      return redirectToOAuthSettingsError("fitbit_token_exchange_failed", tokens.message || JSON.stringify(tokens));
    }

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token; 
    const expiresIn = tokens.expires_in; 
    const scopesGranted = tokens.scope; 
    const userId = tokens.user_id; // Fitbit specific user ID

    if (!refreshToken) {
      console.error('No Fitbit refresh token received.');
      return redirectToOAuthSettingsError("no_refresh_token_issued");
    }

    // 4. Optionally fetch user profile to get email or display name
    // This step is optional but good for user identification if needed
    const profileResponse = await fetch("https://api.fitbit.com/1/user/-/profile.json", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    const profileData = await profileResponse.json();
    const connectedFitbitUserIdentifier = profileData.user?.fullName || profileData.user?.encodedId || userId;


    // Store Fitbit config in database using Prisma
    try {
      const encryptedRefreshToken = encrypt(refreshToken);

      await prisma.oAuthServices.upsert({
        where: {
          name: 'fitbit',
        },
        update: {
          properties: {
            connectedUserIdentifier: connectedFitbitUserIdentifier, // Store a user-friendly identifier
            accessToken: accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000), // Calculate expiry date
            scopes: scopesGranted,
            encryptedRefreshToken: encryptedRefreshToken,
            fitbitUserId: userId,
          },
          updatedAt: new Date(),
        },
        create: {
          name: 'fitbit',
          properties: {
            connectedUserIdentifier: connectedFitbitUserIdentifier,
            accessToken: accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            scopes: scopesGranted,
            encryptedRefreshToken: encryptedRefreshToken,
            fitbitUserId: userId,
          },
        },
      });

      console.log("Fitbit config stored successfully for:", connectedFitbitUserIdentifier);
    } catch (configError: unknown) {
      console.error("Error storing Fitbit config in database:", configError);
      const errorMessage = configError instanceof Error ? configError.message : String(configError);
      return redirectToOAuthSettingsError("db_config_failed", errorMessage);
    }

    const successUrl = new URL("/dashboard/admin/oauth-settings", new URL(FITBIT_REDIRECT_URI).origin);
    successUrl.searchParams.set("success", "fitbit_connected");
    return NextResponse.redirect(successUrl.toString());

  } catch (error: any) {
    console.error("Error during Fitbit token exchange or profile fetch:", error);
    return redirectToOAuthSettingsError("fitbit_auth_failed", error.message || JSON.stringify(error));
  }
}
