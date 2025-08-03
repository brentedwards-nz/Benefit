// app/api/admin/connect-gmail/callback/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client for server-side operations

// Ensure these environment variables are correctly set.
// Use the exact names from your .env.local file.
const GOOGLE_GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID!;
const GOOGLE_GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET!;
const GOOGLE_GMAIL_CLIENT_REDIRECT_URI =
  process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!; // This is the URL of this file itself!

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Base URL for redirects

// Initialize Supabase Admin Client (uses service_role_key for full permissions)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code"); // Authorization code from Google
  const errorParam = searchParams.get("error"); // Error from Google if authorization failed
  const errorDescription = searchParams.get("error_description");

  // Helper for consistent redirects
  const redirectToDashboardClubError = (
    errorType: string,
    details?: string
  ) => {
    const url = new URL("/dashboard/club/error", BASE_URL);
    url.searchParams.set("error", errorType);
    if (details) {
      url.searchParams.set("details", details);
    }
    return NextResponse.redirect(url.toString());
  };

  // 1. Handle errors from Google's redirect (e.g., user denied access)
  if (errorParam) {
    console.error("Google OAuth Error:", errorParam, errorDescription);
    return redirectToDashboardClubError(
      "gmail_auth_denied",
      errorDescription || errorParam
    );
  }

  // 2. Check if an authorization code was received
  if (!code) {
    console.error("No authorization code found in callback.");
    return redirectToDashboardClubError("no_auth_code");
  }

  // Initialize OAuth2 client with your credentials
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_GMAIL_CLIENT_ID,
    GOOGLE_GMAIL_CLIENT_SECRET,
    GOOGLE_GMAIL_CLIENT_REDIRECT_URI
  );

  try {
    // 3. Exchange the authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token; // This is the long-lived token we need!
    const expiryDate = tokens.expiry_date;
    const scopesGranted = tokens.scope;

    // CRITICAL: Ensure a refresh token was issued.
    // If not, 'access_type: offline' or 'prompt: consent' might be missing from the initial auth URL.
    if (!refreshToken) {
      console.error(
        'No refresh token received. Ensure "access_type: offline" and "prompt: consent" are used in generateAuthUrl.'
      );
      return redirectToDashboardClubError("no_refresh_token_issued");
    }

    // 4. Get the email address of the account that was just connected
    // Temporarily set credentials with the new access token to fetch profile
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const connectedEmailAddress = profileResponse.data.emailAddress;

    if (connectedEmailAddress == null) {
      return redirectToDashboardClubError(
        "vault_store_failed",
        "Error getting user profile"
      );
    }

    // --- 5. Store Refresh Token in Supabase Vault & Config in system_gmail_config table ---

    // Call the RPC function `public.vault_create_secret`
    const rpcResult = await supabaseAdmin.rpc("vault_create_secret", {
      p_name: `gmail_refresh_token_${connectedEmailAddress.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`, // Create a unique name for the secret
      p_secret: refreshToken, // The actual refresh token
      p_description: `Gmail Refresh Token for system account: ${connectedEmailAddress}`,
    });

    const { data: vaultSecretData, error: vaultError } = rpcResult;

    if (vaultError) {
      console.error("Error storing refresh token in Vault:", vaultError);
      return redirectToDashboardClubError(
        "vault_store_failed",
        vaultError.message
      );
    }

    // Supabase RPCs usually return an array of objects for single row, so access [0].id
    const vaultSecretId = vaultSecretData;

    if (!vaultSecretId) {
      console.error(
        "Vault secret ID was not returned by vault_create_secret RPC."
      );
      return redirectToDashboardClubError(
        "vault_id_missing",
        "Vault secret ID was not returned by vault_create_secret RPC."
      );
    }

    const { error: configError } = await supabaseAdmin
      .from("system_gmail_config")
      .upsert(
        {
          connected_email: connectedEmailAddress,
          access_token: accessToken!, // Access token is short-lived and will be refreshed
          expires_at: new Date(expiryDate!).toISOString(),
          scopes: scopesGranted!,
          vault_secret_id: vaultSecretId, // Link to the securely stored refresh token in Vault
        },
        { onConflict: "connected_email", ignoreDuplicates: false }
      );

    if (configError) {
      console.error(
        "Error storing Gmail config in Supabase table:",
        configError
      );
      return redirectToDashboardClubError(
        "db_config_failed",
        configError.message
      );
    }

    const successUrl = new URL("/dashboard/club/email_auth", BASE_URL);
    successUrl.searchParams.set("success", "gmail_connected");
    return NextResponse.redirect(successUrl.toString());
  } catch (error: any) {
    console.error(
      "Error during token exchange or profile fetch:",
      error.message
    );
    return redirectToDashboardClubError("gmail_auth_failed", error.message);
  }
}
