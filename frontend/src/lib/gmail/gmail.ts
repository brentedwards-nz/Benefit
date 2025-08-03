// lib/gmail.ts
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// Ensure these environment variables are available.
// They should be in .env.local for development and your hosting config for production.
const GOOGLE_GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID!;
const GOOGLE_GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET!;
const GOOGLE_GMAIL_CLIENT_REDIRECT_URI =
  process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!; // Needed for OAuth2Client initialization

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase Admin Client (uses service_role_key for full permissions)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Retrieves an authenticated Gmail API client.
 * Handles refreshing the access token and persisting it back to the database.
 * @returns {Promise<{ gmail: ReturnType<typeof google.gmail>, connectedEmail: string }>} An object containing the Gmail client and the connected email address.
 */
export async function getGmailClient() {
  // 1. Fetch system Gmail configuration from the database
  const { data, error } = await supabaseAdmin
    .from("system_gmail_config")
    .select("access_token, expires_at, connected_email, vault_secret_id")
    .eq("id", 1) // Assuming 'id: 1' is the single system Gmail config
    .single();

  if (error || !data) {
    console.error(
      "Error fetching system Gmail config:",
      error?.message || "No config found"
    );
    throw new Error(
      "System Gmail account not configured or an error occurred fetching config. Please connect it via admin settings."
    );
  }

  let { access_token, expires_at, connected_email, vault_secret_id } = data;

  if (!vault_secret_id) {
    throw new Error(
      "Vault secret ID missing for Gmail config. This should not happen if setup correctly."
    );
  }

  // 2. Retrieve the refresh token from Supabase Vault using the RPC function
  // Using the public.vault_get_secret RPC function you created in the migration
  const { data: refreshTokenData, error: vaultGetError } =
    await supabaseAdmin.rpc("vault_get_secret", { secret_id: vault_secret_id });

  if (vaultGetError) {
    console.error("Error retrieving refresh token from Vault:", vaultGetError);
    throw new Error(
      "Failed to retrieve Gmail refresh token securely. Admin might need to re-connect Gmail."
    );
  }

  const refreshToken = refreshTokenData as string; // Cast to string as RPC returns TEXT

  if (!refreshToken) {
    throw new Error("Refresh token could not be retrieved from Vault.");
  }

  // 3. Initialize Google OAuth2 Client
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_GMAIL_CLIENT_ID,
    GOOGLE_GMAIL_CLIENT_SECRET,
    GOOGLE_GMAIL_CLIENT_REDIRECT_URI
  );

  // Set credentials, including the refresh token
  oauth2Client.setCredentials({
    access_token: access_token,
    refresh_token: refreshToken,
    expiry_date: new Date(expires_at).getTime(), // Set expiry for initial check
  });

  // 4. Attempt to refresh the access token if expired or near expiry
  // The googleapis library handles this automatically when `refresh_token` is set,
  // but we explicitly call it to capture and persist the new access token.
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token && credentials.expiry_date) {
      // If a new access token was obtained, update it in the database
      // Only update if the access token actually changed to avoid unnecessary DB writes
      if (credentials.access_token !== access_token) {
        const { error: updateError } = await supabaseAdmin
          .from("system_gmail_config")
          .update({
            access_token: credentials.access_token,
            expires_at: new Date(credentials.expiry_date).toISOString(),
            updated_at: new Date().toISOString(), // Update timestamp
          })
          .eq("id", 1); // Assuming 'id: 1' is the single system Gmail config

        if (updateError) {
          console.error("Error updating access token in DB:", updateError);
          // Don't throw here, the client can still proceed with the new token
        }
        console.log("Gmail access token refreshed and database updated.");
      }
    }
  } catch (refreshError: any) {
    console.error("Error refreshing Gmail access token:", refreshError.message);
    // This could mean the refresh token itself is expired or revoked.
    // It indicates the admin needs to re-authorize the Gmail account.
    throw new Error(
      "Failed to refresh Gmail access token. Admin needs to re-connect Gmail account."
    );
  }

  // 5. Return the authenticated Gmail client and the connected email address
  return {
    gmail: google.gmail({ version: "v1", auth: oauth2Client }),
    connectedEmail: connected_email,
  };
}

/**
 * Example: Sends an email using the connected system Gmail account.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} htmlBody - HTML content of the email.
 * @returns {Promise<any>} Gmail API response.
 */
export async function sendEmail(to: string, subject: string, htmlBody: string) {
  try {
    const { gmail, connectedEmail } = await getGmailClient();

    // Create the raw email string in RFC 2822 format
    const raw = Buffer.from(
      `To: ${to}\r\n` +
        `From: ${connectedEmail}\r\n` +
        `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=\r\n` + // Encode subject for UTF-8 compatibility
        `Content-Type: text/html; charset="UTF-8"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${htmlBody}`
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // Base64url encode

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
      },
    });
    console.log("Email sent:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to send email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Example: Reads the most recent email from the inbox.
 * @returns {Promise<any>} The content of the most recent email.
 */
export async function readMostRecentEmail() {
  try {
    const { gmail } = await getGmailClient();

    // List messages in the inbox, order by reverse received date, take 1
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "in:inbox", // Only search in inbox
      maxResults: 1,
    });

    const messages = response.data.messages;

    if (!messages || messages.length === 0) {
      console.log("No messages found in inbox.");
      return null;
    }

    const messageId = messages[0].id!;

    // Get the full message content
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full", // 'full' or 'raw'
    });

    // Parse headers and body
    const headers = message.data.payload?.headers;
    const parts = message.data.payload?.parts;
    let emailBody = "";

    const subject = headers?.find((h) => h.name === "Subject")?.value;
    const from = headers?.find((h) => h.name === "From")?.value;
    const date = headers?.find((h) => h.name === "Date")?.value;

    // Function to decode base64url data
    const decodeBase64Url = (data: string) => {
      // The Buffer.from(data, 'base64') needs standard base64, not base64url
      // Add padding back if necessary for standard base64
      let paddedData = data.replace(/-/g, "+").replace(/_/g, "/");
      while (paddedData.length % 4) {
        paddedData += "=";
      }
      return Buffer.from(paddedData, "base64").toString("utf-8");
    };

    // Find and decode the plain text or HTML body
    // Gmail API's 'parts' are recursive. We'll prioritize HTML, then plain text.
    const findEmailPart = (
      payloadParts: any[] | undefined,
      mimeType: string
    ) => {
      if (!payloadParts) return null;
      for (const part of payloadParts) {
        if (part.mimeType === mimeType && part.body?.data) {
          return part.body.data;
        }
        if (part.parts) {
          // Check for nested parts
          const nestedPart = findEmailPart(part.parts, mimeType);
          if (nestedPart) return nestedPart;
        }
      }
      return null;
    };

    let encodedBody =
      findEmailPart(parts, "text/html") || findEmailPart(parts, "text/plain");

    if (encodedBody) {
      emailBody = decodeBase64Url(encodedBody);
    } else if (message.data.payload?.body?.data) {
      // For simple, non-multipart messages (e.g., just plain text body directly in payload.body)
      emailBody = decodeBase64Url(message.data.payload.body.data);
    }

    console.log("Most recent email:", {
      subject,
      from,
      date,
      body: emailBody,
      messageId,
      // raw: message.data, // Uncomment for detailed debugging of raw response
    });

    return { subject, from, date, body: emailBody, messageId };
  } catch (error: any) {
    console.error("Failed to read most recent email:", error.message);
    throw new Error(`Failed to read email: ${error.message}`);
  }
}
