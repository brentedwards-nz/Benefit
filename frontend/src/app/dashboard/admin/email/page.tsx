// Force dynamic rendering to prevent build-time email fetching
export const dynamic = 'force-dynamic';

import Emails, { EmailProps } from "@/components/club/email-list";
import { readEmail } from "@/server-actions/email/actions";
import { Email } from "@/server-actions/email/types";
import { EmailCardProps, EmailCard } from "@/components/cards/email-card";

const transformEmails = (emailData: Email[]): EmailCardProps[] => {
  return emailData.map(
    (email: Email) =>
    ({
      email: email, // Assign the whole email object here
    } as EmailCardProps)
  );
};

export default async function EmailPage() {
  let emails: EmailCardProps[] = [];
  let error: string | null = null;

  try {
    const emailResult = await readEmail("", undefined, undefined, [], ["Benefit"]);

    if (emailResult.success) {
      if (Array.isArray(emailResult.data)) {
        emails = transformEmails(emailResult.data);
      } else {
        console.error(
          "readEmails did not return an array for data:",
          emailResult.data
        );
        error = "Invalid data format received from server.";
      }
    } else {
      error = emailResult.message || "Failed to fetch emails.";
      console.error("Failed to fetch emails:", emailResult.message);
    }
  } catch (err: any) {
    console.error("Error fetching emails:", err);

    // Handle specific Gmail configuration errors gracefully
    if (err.message && err.message.includes('Gmail configuration')) {
      error = "Gmail is not configured. Please connect Gmail in admin settings to view emails.";
    } else if (err.message && err.message.includes('Invalid encrypted text format')) {
      error = "Gmail configuration is invalid. Please re-connect Gmail in admin settings.";
    } else {
      error = err.message || "An unexpected error occurred while loading emails.";
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-red-600">Gmail Configuration Required</div>
        <div className="mt-2 text-sm text-gray-600 max-w-md text-center">{error}</div>
        <div className="mt-4">
          <a
            href="/dashboard/admin/email_auth"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Connect Gmail Account
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          You need to connect a Gmail account to view emails.
        </p>
      </div>
    );
  }

  if (emails.length === 0 && !error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">No emails found.</div>
        <p className="mt-2 text-sm text-gray-500">
          {error ? error : "Connect Gmail in admin settings to start fetching emails."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <Emails emails={emails} />{" "}
        </div>
      </div>
    </div>
  );
}
