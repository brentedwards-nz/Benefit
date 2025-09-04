// server-actions/email/actions.ts
"use server";

// import { createClient } from "@/utils/supabase/server";
import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { ConnectedOAuthAccount, Email, From } from "./types";
import { google } from "googleapis";
import { agentQuery } from "@/utils/ai/agent/agent";
import { getAuthenticatedGmailClient } from "@/lib/gmail-utils";
import {
  AITool,
  AIContent,
  AIConversation,
  LLMType,
} from "@/utils/ai/agent/agentTypes";

export async function readConnectedOAuthAccounts(): Promise<
  ActionResult<ConnectedOAuthAccount[]>
> {
  try {
    const oauthAccounts = await prisma.oAuthServices.findMany({
      select: {
        id: true,
        name: true, // Select the name field to determine account type
        properties: true, // Select the entire properties JSON
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!oauthAccounts) {
      console.warn(
        `readConnectedOAuthAccounts: Could not find connected OAuth accounts`
      );
      throw new Error(
        `readConnectedOAuthAccounts: Could not find connected OAuth accounts`
      );
    }

    const accountsResult: ConnectedOAuthAccount[] = oauthAccounts.map(
      (account) => {
        const connectedEmail = (account.properties as any)?.connectedEmail;
        const displayName = (account.properties as any)?.displayName;
        const accessToken = (account.properties as any)?.accessToken;
        const expiresAt = (account.properties as any)?.expiresAt;
        const scopes = (account.properties as any)?.scopes;
        const encryptedRefreshToken = (account.properties as any)
          ?.encryptedRefreshToken;

        return {
          id: account.id,
          name: account.name === "gmail" ? connectedEmail! : displayName!, // Set the 'name' for display purposes
          connected_email: connectedEmail,
          displayName: displayName,
          account_type:
            account.name === "gmail"
              ? "Gmail"
              : account.name === "fitbit"
              ? "Fitbit"
              : "Unknown", // Dynamically set account type
          access_token: accessToken,
          expires_at: expiresAt ? new Date(expiresAt) : undefined,
          scopes: scopes,
          encrypted_refresh_token: encryptedRefreshToken,
          created_at: account.createdAt,
          updated_at: account.updatedAt,
        } as ConnectedOAuthAccount;
      }
    );

    return {
      success: true,
      data: accountsResult,
    };
  } catch (err: any) {
    console.error("Error:");
    console.error(` - Function: readConnectedOAuthAccounts`);
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

function getEmailBody(payload: any): string {
  let body = "";
  if (payload.parts) {
    // Handle multipart messages
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body.data) {
        body = part.body.data;
        break; // Found the text body, no need to look further
      }
    }
  } else if (payload.body.data) {
    // Handle simple messages
    body = payload.body.data;
  }

  // Decode the base64-encoded body
  if (body) {
    return Buffer.from(body, "base64").toString("utf-8");
  }
  return "";
}

const createGmailQuery = (
  folders: string[],
  labels: string[],
  clientEmail: string,
  startDate?: Date,
  endDate?: Date
): string => {
  const folderQueries = folders.map((folder) => `in:${folder}`);
  const labelQueries = labels.map((label) => `label:${label}`);
  const clientEmailQuery = `(to:${clientEmail} OR from:${clientEmail})`;

  const dateQueries: string[] = [];
  if (startDate) {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const day = startDate.getDate();
    // Create a UTC date for the start of the day
    const utcStartDate = new Date(Date.UTC(year, month, day));
    dateQueries.push(
      `after:${utcStartDate.toISOString().split("T")[0].replace(/-/g, "/")}`
    );
  }
  if (endDate) {
    const year = endDate.getFullYear();
    const month = endDate.getMonth();
    const day = endDate.getDate();
    // Create a UTC date for the end of the day (by taking the next day's start)
    const utcNextDay = new Date(Date.UTC(year, month, day + 1));
    dateQueries.push(
      `before:${utcNextDay.toISOString().split("T")[0].replace(/-/g, "/")}`
    );
  }

  const allQueries = [
    ...folderQueries,
    ...labelQueries,
    clientEmailQuery,
    ...dateQueries,
  ];

  // Filter out empty strings from the array before joining
  const filteredQueries = allQueries.filter((query) => query.trim() !== "");

  if (filteredQueries.length === 0) {
    return "";
  }

  const queryString = filteredQueries.join(" AND "); // Use AND to combine client email with folders/labels
  return queryString;
};

export async function readEmail(
  clientEmail: string,
  startDate?: Date,
  endDate?: Date,
  folders: string[] = ["Inbox"],
  labels: string[] = ["Benefit"], // Default to "Benefit" label
  usAi: boolean = false
): Promise<ActionResult<Email[]>> {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      return {
        success: false,
        message: "Email service not available during build time",
        code: "BUILD_TIME_ERROR",
      };
    }

    // Check if there are any Gmail configurations first
    const gmailConfigs = await prisma.oAuthServices.findMany({
      select: { id: true, properties: true },
    });

    //console.log(JSON.stringify(gmailConfigs, null, 2));

    if (gmailConfigs.length === 0) {
      return {
        success: false,
        message:
          "No Gmail accounts configured. Please connect Gmail in admin settings.",
        code: "NO_GMAIL_CONFIG",
      };
    }

    // Use the authenticated Gmail client utility
    const { gmail, connectedEmail } = await getAuthenticatedGmailClient();

    //q: `in:${folder1} OR label:${label1}`,
    // Modify createGmailQuery to include clientEmail
    const query: string = createGmailQuery(
      folders,
      labels,
      clientEmail,
      startDate,
      endDate
    );

    //console.log("Gmail API Query:", query); // Add this line for debugging
    // 5. List messages from the specified folder
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 25, // Limit the number of emails to fetch
    });

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // 6. Fetch full details for each email message
    const emailPromises = messages.map((message) =>
      gmail.users.messages.get({
        userId: "me",
        id: message.id!,
      })
    );

    const emailResponses = await Promise.all(emailPromises);

    // 7. Parse the API responses into the desired Email type
    const ePromises = emailResponses.map(async (res) => {
      const headers = res.data.payload?.headers || [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";

      const fromHeader =
        headers.find((h) => h.name === "From")?.value || "Unknown Sender";

      let senderName: string;
      let senderEmail: string;

      // Use a regular expression to parse the "From" header
      const match = fromHeader.match(/(.*)<(.*)>/);

      if (match && match[1] && match[2]) {
        senderName = match[1].replace(/"/g, "").trim();
        senderEmail = match[2].trim();
      } else {
        senderName = fromHeader.trim();
        senderEmail = fromHeader.trim();
      }
      const from: From = {
        name: senderName,
        email: senderEmail,
      };

      const emailBody = getEmailBody(res.data.payload);
      const dateHeader = headers.find((h) => h.name === "Date")?.value;
      let receivedAt: string;

      if (dateHeader) {
        try {
          receivedAt = new Date(dateHeader).toLocaleString();
        } catch (e) {
          console.warn(
            "Invalid Date header, falling back to internalDate:",
            dateHeader
          );
          receivedAt = res.data.internalDate
            ? new Date(parseInt(res.data.internalDate)).toLocaleString()
            : "Unknown Date";
        }
      } else {
        receivedAt = res.data.internalDate
          ? new Date(parseInt(res.data.internalDate)).toLocaleString()
          : "Unknown Date";
      }

      if (emailBody.trim().length == 0) {
        const body: string = "Body of email was empty or un-readable";
        return {
          from,
          subject,
          body,
          receivedAt,
        };
      }

      const prompt: string = `
        Summarize this email.
        Keep the top 3 main points, 
        Any closing salutation like 'Kind Regards.' including sender name
        Remove any legal disclaimers or unnecessary text.
      `;

      try {
        let body = emailBody;

        if (usAi) {
          const conversation: AIConversation = {
            model: "Groq",
            prompt: prompt,
            toolList: [],
            conversation: [
              {
                id: 1,
                content: emailBody,
                type: "user",
              },
            ],
          };
          const aiResponse = await agentQuery(conversation);
          body = aiResponse.content;
        }

        return {
          from,
          subject,
          body,
          receivedAt,
        };
      } catch (error) {
        // If the AI call fails, return the original email body
        return {
          from,
          subject,
          body: emailBody,
          receivedAt,
        };
      }
    });

    // Now, use Promise.all to wait for all the promises to resolve
    const emails: Email[] = await Promise.all(ePromises);

    return {
      success: true,
      data: emails,
    };
  } catch (err: any) {
    console.error("An error occurred while fetching emails:", err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  } finally {
    await prisma.$disconnect();
  }
}
