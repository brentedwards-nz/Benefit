// app/api/admin/connect-gmail/callback/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma/client";
import { encrypt } from "@/lib/encryption";

// Ensure these environment variables are correctly set.
// Use the exact names from your .env.local file.
const GOOGLE_GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID!;
const GOOGLE_GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET!;
const GOOGLE_GMAIL_CLIENT_REDIRECT_URI =
  process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!; // This is the URL of this file itself!

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Get base URL from request headers or environment
const getBaseUrl = (request: Request) => {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Base URL for redirects

// Initialize Supabase Admin Client (uses service_role_key for full permissions)
// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: Request) {
  // Helper for consistent redirects
  const redirectToDashboardAdminError = (
    errorType: string,
    details?: string
  ) => {
    const baseUrl = getBaseUrl(request);
    const url = new URL("/dashboard/admin/error", baseUrl);
    url.searchParams.set("error", errorType);
    if (details) {
      url.searchParams.set("details", details);
    }
    return NextResponse.redirect(url.toString());
  };

  // Validate environment variables
  if (!GOOGLE_GMAIL_CLIENT_ID || !GOOGLE_GMAIL_CLIENT_SECRET || !GOOGLE_GMAIL_CLIENT_REDIRECT_URI) {
    console.error("Missing Google OAuth environment variables");
    return redirectToDashboardAdminError("missing_env_vars", "Google OAuth credentials not configured");
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code"); // Authorization code from Google
  const errorParam = searchParams.get("error"); // Error from Google if authorization failed
  const errorDescription = searchParams.get("error_description");

  // 1. Handle errors from Google's redirect (e.g., user denied access)
  if (errorParam) {
    console.error("Google OAuth Error:", errorParam, errorDescription);
    return redirectToDashboardAdminError(
      "gmail_auth_denied",
      errorDescription || errorParam
    );
  }

  // 2. Check if an authorization code was received
  if (!code) {
    console.error("No authorization code found in callback.");
    return redirectToDashboardAdminError("no_auth_code");
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
      return redirectToDashboardAdminError("no_refresh_token_issued");
    }

    // 4. Get the email address of the account that was just connected
    // Temporarily set credentials with the new access token to fetch profile
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const connectedEmailAddress = profileResponse.data.emailAddress;

    if (connectedEmailAddress == null) {
      return redirectToDashboardAdminError(
        "vault_store_failed",
        "Error getting user profile"
      );
    }

    // Store Gmail config in database using Prisma
    try {
      // Encrypt the refresh token before storing
      const encryptedRefreshToken = encrypt(refreshToken);

      const result = await prisma.systemGmailConfig.upsert({
        where: {
          connected_email: connectedEmailAddress,
        },
        update: {
          access_token: accessToken!,
          expires_at: new Date(expiryDate!),
          scopes: scopesGranted!,
          encrypted_refresh_token: encryptedRefreshToken,
          updated_at: new Date(),
        },
        create: {
          connected_email: connectedEmailAddress,
          access_token: accessToken!,
          expires_at: new Date(expiryDate!),
          scopes: scopesGranted!,
          encrypted_refresh_token: encryptedRefreshToken,
        },
      });

      console.log("Gmail config stored successfully:", result.connected_email);
    } catch (configError: any) {
      console.error("Error storing Gmail config in database:", configError);
      return redirectToDashboardAdminError(
        "db_config_failed",
        configError.message
      );
    }

    const baseUrl = getBaseUrl(request);
    const successUrl = new URL("/dashboard/admin/email_auth", baseUrl);
    successUrl.searchParams.set("success", "gmail_connected");
    return NextResponse.redirect(successUrl.toString());
  } catch (error: any) {
    console.error(
      "Error during token exchange or profile fetch:",
      error.message
    );
    return redirectToDashboardAdminError("gmail_auth_failed", error.message);
  }
}
