// app/dashboard/club/email_auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

import { readConnectedGmailAccounts } from "@/server-actions/email/actions";
import { ConnectedGmailAccount } from "@/server-actions/email/types";

// Map error codes to user-friendly messages for easier maintenance
const errorMessages = {
  gmail_auth_denied: "Gmail access denied by user.",
  no_auth_code: "Authentication failed: No code received from Google.",
  no_refresh_token_issued:
    "Authentication failed: No refresh token issued. Check OAuth client settings (access_type=offline, prompt=consent).",
  vault_store_failed:
    "Failed to store Gmail refresh token securely. Check server logs.",
  vault_id_missing: "Internal error: Vault secret ID missing.",
  db_config_failed: "Failed to save Gmail configuration in the database.",
  gmail_auth_failed: "Gmail authentication process failed.",
  server_config_error:
    "Server configuration missing for Google Gmail connector.",
};

// Define the type for a connected account based on your table schema
type ConnectedAccount = {
  id: number;
  connected_email: string;
};

const EmailAuth = () => {
  const searchParams = useSearchParams();
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedGmailAccount[]
  >([]);
  const [isFetching, startTransition] = useTransition();

  const fetchConnectedAccounts = () => {
    // No longer needs to be async
    startTransition(async () => {
      try {
        const response = await readConnectedGmailAccounts();

        if (!response.success) {
          throw new Error("Failed to fetch connected accounts");
        }

        const data = response.data;
        setConnectedAccounts(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load accounts", {
          description: "Could not fetch the list of connected email accounts.",
        });
      }
    });
  };

  // Function to handle the disconnection
  const handleDisconnect = async (accountId: bigint, accountEmail: string) => {
    const confirmation = window.confirm(
      `Are you sure you want to disconnect the account "${accountEmail}"?`
    );
    if (!confirmation) {
      return;
    }

    try {
      // Replace with your actual API endpoint for disconnection
      const response = await fetch(
        `/api/admin/disconnect-gmail?id=${accountId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to disconnect account");
      }

      // Optimistically update the UI by filtering out the disconnected account
      setConnectedAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account.id !== accountId)
      );

      toast.success("Account Disconnected", {
        description: `Successfully unlinked ${accountEmail}.`,
      });
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection Failed", {
        description: `Could not unlink ${accountEmail}. Please try again.`,
      });
    }
  };

  // This useEffect handles the toast notifications from the URL parameters
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const details = searchParams.get("details");

    if (success === "gmail_connected") {
      toast.success("Gmail Account Connected!", {
        description: "Your system Gmail account has been successfully linked.",
      });
      fetchConnectedAccounts(); // Refresh the list of accounts
    } else if (error) {
      const errorMessage =
        errorMessages[error as keyof typeof errorMessages] ||
        "An unknown error occurred.";
      toast.error("Gmail Connection Failed!", {
        description: details
          ? `${errorMessage} Details: ${details}`
          : errorMessage,
      });
    }
  }, [searchParams]);

  // This useEffect fetches the accounts on the initial page load
  useEffect(() => {
    fetchConnectedAccounts();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

      {/* Gmail Connection Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Gmail Account Integration</CardTitle>
          <CardDescription>
            Connect a dedicated Gmail account for your application to send and
            receive emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/api/admin/connect-gmail" passHref>
            <Button>Connect New Gmail Account</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Connected Accounts</CardTitle>
          <CardDescription>
            Manage the list of all email accounts connected to your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching && <p>Loading connected accounts...</p>}
          {!isFetching && connectedAccounts.length === 0 && (
            <p>No email accounts are currently connected.</p>
          )}
          {!isFetching && connectedAccounts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Email Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.connected_email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          handleDisconnect(account.id, account.connected_email)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAuth;
