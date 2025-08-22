// app/api/admin/connect-fitbit/callback/route.ts
import { encrypt } from '@/lib/encryption';
import prisma from '@/utils/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { OAuthServices } from '@prisma/client';
import { getBaseUrl } from '@/lib/utils'; // Assuming getBaseUrl is in utils

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const redirectToDashboardAdminError = (
    errorType: string,
    details?: string
  ) => {
    const baseUrl = getBaseUrl(request);
    const url = new URL("/dashboard/admin/oauth-settings", baseUrl);
    url.searchParams.set("error", errorType);
    if (details) {
      url.searchParams.set("details", details);
    }
    return NextResponse.redirect(url.toString());
  };

  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET || !FITBIT_REDIRECT_URI) {
    console.error("Missing Fitbit OAuth environment variables");
    return redirectToDashboardAdminError(
      "missing_env_vars",
      "Fitbit OAuth credentials not configured"
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    console.error("Fitbit OAuth Error:", errorParam, errorDescription);
    return redirectToDashboardAdminError(
      "fitbit_auth_denied",
      errorDescription || errorParam
    );
  }

  if (!code) {
    console.error("No authorization code found in Fitbit callback.");
    return redirectToDashboardAdminError("no_auth_code");
  }

  try {
    // Exchange the authorization code for access and refresh tokens
    const tokenResponse = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: FITBIT_CLIENT_ID,
        grant_type: "authorization_code",
        redirect_uri: FITBIT_REDIRECT_URI,
        code: code,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Fitbit Token Exchange Error:", errorData);
      return redirectToDashboardAdminError(
        "fitbit_token_exchange_failed",
        errorData.message || "Unknown error during token exchange"
      );
    }

    const tokens = await tokenResponse.json();

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiresIn = tokens.expires_in;
    const scopesGranted = tokens.scope; // This is a space-separated string
    const userId = tokens.user_id; // Fitbit provides user_id directly

    if (!refreshToken) {
      console.error("No refresh token received from Fitbit.");
      return redirectToDashboardAdminError("no_refresh_token_issued_fitbit");
    }

    // Get user profile to confirm connection and get user details if needed
    const profileResponse = await fetch(
      `https://api.fitbit.com/1/user/-/profile.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error("Fitbit Profile Fetch Error:", errorData);
      return redirectToDashboardAdminError(
        "fitbit_profile_fetch_failed",
        errorData.message || "Unknown error fetching Fitbit profile"
      );
    }

    const profile = await profileResponse.json();
    const fitbitUserDisplayName = profile.user.displayName;

    try {
      const encryptedRefreshToken = encrypt(refreshToken);

      // Check if an OAuth service entry already exists for this Fitbit account
      let existingOAuthService = await prisma.oAuthServices.findFirst({
        where: {
          name: "fitbit",
          properties: {
            path: ["userId"],
            equals: userId,
          },
        },
      });

      if (existingOAuthService) {
        // Update the existing entry
        await prisma.oAuthServices.update({
          where: {
            id: existingOAuthService.id,
          },
          data: {
            properties: {
              userId: userId,
              displayName: fitbitUserDisplayName,
              accessToken: accessToken,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              scopes: scopesGranted,
              encryptedRefreshToken: encryptedRefreshToken,
            },
            updatedAt: new Date(),
          },
        });
      } else {
        // Create a new entry if no existing one is found for this user
        await prisma.oAuthServices.create({
          data: {
            name: "fitbit",
            properties: {
              userId: userId,
              displayName: fitbitUserDisplayName,
              accessToken: accessToken,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              scopes: scopesGranted,
              encryptedRefreshToken: encryptedRefreshToken,
            },
          },
        });
      }

      console.log("Fitbit config stored successfully for user:", userId);
    } catch (configError: unknown) {
      console.error("Error storing Fitbit config in database:", configError);
      const errorMessage = configError instanceof Error ? configError.message : String(configError);
      return redirectToDashboardAdminError(
        "db_config_failed_fitbit",
        errorMessage
      );
    }

    const baseUrl = getBaseUrl(request);
    const successUrl = new URL("/dashboard/admin/oauth-settings", baseUrl);
    successUrl.searchParams.set("success", "fitbit_connected");
    return NextResponse.redirect(successUrl.toString());
  } catch (error: unknown) {
    console.error("Error during Fitbit OAuth flow:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return redirectToDashboardAdminError("fitbit_auth_failed", errorMessage);
  }
}
