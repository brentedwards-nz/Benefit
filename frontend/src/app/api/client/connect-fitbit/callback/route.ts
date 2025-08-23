import { encrypt } from '@/lib/encryption';
import prisma from '@/utils/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/utils'; // Assuming getBaseUrl is in utils
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const redirectToClientSettingsError = (
    errorType: string,
    details?: string
  ) => {
    const baseUrl = getBaseUrl(request);
    const url = new URL("/dashboard/client/settings", baseUrl);
    url.searchParams.set("error", errorType);
    if (details) {
      url.searchParams.set("details", details);
    }
    return NextResponse.redirect(url.toString());
  };

  const redirectToClientSettingsSuccess = (successType: string) => {
    const baseUrl = getBaseUrl(request);
    const url = new URL("/dashboard/client/settings", baseUrl);
    url.searchParams.set("success", successType);
    return NextResponse.redirect(url.toString());
  };

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return redirectToClientSettingsError("unauthenticated", "User not authenticated.");
  }

  const authenticatedAuthId = session.user.id; // This is the authId from your User model

  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET || !FITBIT_REDIRECT_URI) {
    console.error("Missing Fitbit OAuth environment variables");
    return redirectToClientSettingsError(
      "server_config_error",
      "Fitbit OAuth credentials not configured"
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const state = searchParams.get("state");

  if (errorParam) {
    console.error("Fitbit OAuth Error:", errorParam, errorDescription);
    return redirectToClientSettingsError(
      "fitbit_auth_denied",
      errorDescription || errorParam
    );
  }

  if (!code) {
    console.error("No authorization code found in Fitbit callback.");
    return redirectToClientSettingsError("no_auth_code");
  }

  if (!state) {
    console.error("State parameter missing in Fitbit callback.");
    return redirectToClientSettingsError("state_missing");
  }

  // Validate state to prevent CSRF attacks and get client ID
  const [clientIdFromState, randomString] = state.split(":");

  const client = await prisma.client.findUnique({
    where: {
      id: clientIdFromState,
      authId: authenticatedAuthId,
    },
    select: {
      id: true,
      settings: true,
    },
  });

  if (!client) {
    console.error("Client not found or state mismatch for authId:", authenticatedAuthId, "clientIdFromState:", clientIdFromState);
    return redirectToClientSettingsError("client_not_found_or_mismatch");
  }

  try {
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
      return redirectToClientSettingsError(
        "fitbit_token_exchange_failed",
        errorData.message || "Unknown error during token exchange"
      );
    }

    const tokens = await tokenResponse.json();

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiresIn = tokens.expires_in;
    const scopesGranted = tokens.scope;
    const fitbitUserId = tokens.user_id; // Fitbit provides user_id directly

    if (!refreshToken) {
      console.error("No refresh token received from Fitbit.");
      return redirectToClientSettingsError("no_refresh_token_issued_fitbit");
    }

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
      return redirectToClientSettingsError(
        "fitbit_profile_fetch_failed",
        errorData.message || "Unknown error fetching Fitbit profile"
      );
    }

    const profile = await profileResponse.json();
    const fitbitUserDisplayName = profile.user.displayName;

    try {
      const encryptedRefreshToken = encrypt(refreshToken);
      const encryptedAccessToken = encrypt(accessToken);

      let currentSettingsArray = (client.settings || []) as Array<Record<string, any>>;
      
      // Generate a unique ID for this specific Fitbit connection
      const connectionId = `fitbit-${fitbitUserId}`;

      // Find if an existing Fitbit setting for this userId exists
      let existingSettingIndex = currentSettingsArray.findIndex(
        (setting) => setting.id === connectionId && setting.type === "Fitbit"
      );

      const newFitbitSetting = {
        id: connectionId,
        type: "Fitbit",
        properties: [
          { name: "userId", value: fitbitUserId, editable: false, encrypted: false },
          { name: "displayName", value: fitbitUserDisplayName, editable: true, encrypted: false },
          { name: "accessToken", value: encryptedAccessToken, editable: false, encrypted: true },
          { name: "expiresAt", value: new Date(Date.now() + expiresIn * 1000).toISOString(), editable: false, encrypted: false },
          { name: "scopes", value: scopesGranted, editable: false, encrypted: false },
          { name: "refreshToken", value: encryptedRefreshToken, editable: false, encrypted: true },
          { name: "connectedAt", value: new Date().toISOString(), editable: false, encrypted: false },
        ],
      };

      if (existingSettingIndex !== -1) {
        // Update existing setting
        currentSettingsArray[existingSettingIndex] = newFitbitSetting;
      } else {
        // Add new setting
        currentSettingsArray.push(newFitbitSetting);
      }

      await prisma.client.update({
        where: { id: client.id },
        data: {
          settings: currentSettingsArray,
        },
      });

      console.log("Client Fitbit config stored successfully for user:", fitbitUserId);
    } catch (configError: unknown) {
      console.error("Error storing client Fitbit config in database:", configError);
      const errorMessage = configError instanceof Error ? configError.message : String(configError);
      return redirectToClientSettingsError(
        "db_config_failed_client_fitbit",
        errorMessage
      );
    }

    return redirectToClientSettingsSuccess("fitbit_connected");
  } catch (error: unknown) {
    console.error("Error during client Fitbit OAuth flow:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return redirectToClientSettingsError("fitbit_auth_failed", errorMessage);
  }
}
