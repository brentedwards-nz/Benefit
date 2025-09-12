"use client";

import { useQuery, QueryFunctionContext } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { readEmail } from "@/server-actions/email/actions";

interface ClientEmailsSummaryProps {
  clientId: string;
  clientEmail: string;
  startDate: Date;
  endDate: Date;
}

const fetchClientEmails = async (context: QueryFunctionContext) => {
  const [_key, clientId, clientEmail, startDate, endDate] = context.queryKey;

  if (
    !clientId ||
    !clientEmail ||
    typeof clientEmail !== "string" ||
    !(startDate instanceof Date) ||
    !(endDate instanceof Date)
  ) {
    return [];
  }

  const emailsResult = await readEmail(
    clientEmail,
    startDate,
    endDate,
    [],
    ["Benefit"]
  );

  if (!emailsResult.success) {
    throw new Error(
      emailsResult.message || "Could not retrieve client emails."
    );
  }
  return emailsResult.data || [];
};

export const ClientEmailsSummary = ({
  clientId,
  clientEmail,
  startDate,
  endDate,
}: ClientEmailsSummaryProps) => {
  const {
    data: clientEmails = [],
    isLoading: isLoadingEmails,
    error: clientEmailsError,
  } = useQuery({
    queryKey: ["clientEmails", clientId, clientEmail, startDate, endDate],
    queryFn: fetchClientEmails,
    enabled: !!clientId && !!clientEmail,
  });

  if (clientEmailsError) {
    console.error("Failed to fetch client emails:", clientEmailsError);
    toast.error("Failed to load emails", {
      description: (clientEmailsError as Error).message,
    });
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Client Emails Summary</CardTitle>
        {!isLoadingEmails && clientEmails.length === 0 && (
          <CardDescription>
            Summary of client's emails will be displayed here.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingEmails ? (
          <Loading
            title="Loading Client Emails"
            description="Fetching client's email data..."
            size="sm"
          />
        ) : clientEmails.length > 0 ? (
          <ul className="space-y-4">
            {clientEmails.map((email, index) => (
              <li key={index} className="border p-3 rounded-md">
                <p className="font-semibold">Subject: {email.subject}</p>
                <p className="text-sm text-muted-foreground">
                  Received: {email.receivedAt}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {email.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No emails found for this client.</p>
        )}
      </CardContent>
    </Card>
  );
};