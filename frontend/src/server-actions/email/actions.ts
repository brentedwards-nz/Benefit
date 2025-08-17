// server-actions/email/actions.ts
"use server";

// import { createClient } from "@/utils/supabase/server";
import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { ConnectedGmailAccount, Email, From } from "./types";
import { google } from "googleapis";
import { agentQuery } from "@/utils/ai/agent/agent";
import { getAuthenticatedGmailClient } from "@/lib/gmail-utils";
import {
  AITool,
  AIContent,
  AIConversation,
  LLMType,
} from "@/utils/ai/agent/agentTypes";

export async function readConnectedGmailAccounts(): Promise<
  ActionResult<ConnectedGmailAccount[]>
> {


  try {
    // TODO: Implement NextAuth authentication check
    // const supabase = await createClient();
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();
    // if (!user) {
    //   throw new Error("Unauthorized: You must be logged in.");
    // }

    const gmailAccounts = await prisma.systemGmailConfig.findMany({
      select: {
        id: true,
        connectedEmail: true,
        accessToken: true,
        expiresAt: true,
        scopes: true,
        encryptedRefreshToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!gmailAccounts) {
      console.warn(
        `ReadConnectedGmailAccounts: Could not find connected gmail accounts`
      );
      throw new Error(
        `ReadConnectedGmailAccounts: Could not find connected gmail accounts`
      );
    }

    const accountsResult: ConnectedGmailAccount[] = gmailAccounts.map(
      (account) =>
      ({
        id: account.id,
        connected_email: account.connectedEmail,
        access_token: account.accessToken,
        expires_at: account.expiresAt,
        scopes: account.scopes,
        encrypted_refresh_token: account.encryptedRefreshToken,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
      } as ConnectedGmailAccount)
    );

    return {
      success: true,
      data: accountsResult,
    };
  } catch (err: any) {
    console.error("Error:");
    console.error(` - Function: readConnectedGmailAccounts`);
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${err.message || "Unknown error"
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

const createGmailQuery = (folders: string[], labels: string[]): string => {
  const folderQueries = folders.map((folder) => `in:${folder}`);
  const labelQueries = labels.map((label) => `label:${label}`);

  const allQueries = [...folderQueries, ...labelQueries];

  if (allQueries.length === 0) {
    return "";
  }

  const queryString = allQueries.join(" OR ");
  return queryString;
};

export async function readEmail(
  folders: string[] = ["Inbox"],
  labels: string[] = [""],
  usAi: boolean = false
): Promise<ActionResult<Email[]>> {
  try {
    // Check if there are any Gmail configurations first
    const gmailConfigs = await prisma.systemGmailConfig.findMany({
      select: { id: true, connectedEmail: true }
    });

    if (gmailConfigs.length === 0) {
      return {
        success: false,
        message: "No Gmail accounts configured. Please connect Gmail in admin settings.",
        code: "NO_GMAIL_CONFIG",
      };
    }

    // Use the authenticated Gmail client utility
    const { gmail, connectedEmail } = await getAuthenticatedGmailClient();

    //q: `in:${folder1} OR label:${label1}`,
    const query: string = createGmailQuery(folders, labels);

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
      if (emailBody.trim().length == 0) {
        const body: string = "Body of email was empty or un-readable";
        return {
          from,
          subject,
          body,
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
        };
      } catch (error) {
        // If the AI call fails, return the original email body
        return {
          from,
          subject,
          body: emailBody,
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
      message: `An unexpected server error occurred: ${err.message || "Unknown error"
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
