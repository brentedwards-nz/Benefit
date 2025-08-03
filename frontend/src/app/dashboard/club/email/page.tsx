// app/clubs/page.tsx (assuming this is your file structure)
// NO "use client" directive here

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
    const emailResult = await readEmail(["InBox"], ["Benefit"]);

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
      error = emailResult.message || "Failed to fetch clubs.";
      console.error("Failed to fetch emails:", emailResult.message);
    }
  } catch (err: any) {
    console.error("Error fetching clubs:", err);
    error = err.message || "An unexpected error occurred while loading clubs.";
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-red-600">Error: {error}</div>
        {/* No client-side retry for now, as it's a Server Component */}
        <p className="mt-2 text-sm text-gray-500">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">No emails found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <Emails emails={emails} />{" "}
        </div>
      </div>
    </div>
  );
}
