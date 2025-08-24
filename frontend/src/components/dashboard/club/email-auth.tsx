// app/dashboard/club/email_auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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

import { readConnectedOAuthAccounts } from "@/server-actions/email/actions";
import { ConnectedOAuthAccount } from "@/server-actions/email/types";

// Map error codes to user-friendly messages for easier maintenance
const errorMessages = {
  gmail_auth_denied: "Gmail access denied by user.",
  no_auth_code: "Authentication failed: No code received from the OAuth provider.",
  no_refresh_token_issued:
    "Authentication failed: No refresh token issued. Check OAuth client settings (access_type=offline, prompt=consent).",
  vault_store_failed:
    "Failed to store refresh token securely. Check server logs.",
  vault_id_missing: "Internal error: Vault secret ID missing.",
  db_config_failed: "Failed to save OAuth configuration in the database.",
  gmail_auth_failed: "Gmail authentication process failed.",
  fitbit_auth_denied: "Fitbit access denied by user.",
  fitbit_token_exchange_failed: "Fitbit token exchange failed.",
  server_config_error:
    "Server configuration missing for Google Gmail connector.",
  no_refresh_token_issued_fitbit: "Authentication failed: No refresh token issued from Fitbit.",
  fitbit_profile_fetch_failed: "Failed to fetch Fitbit profile.",
  db_config_failed_fitbit: "Failed to save Fitbit OAuth configuration in the database.",
};

const EmailAuth = () => {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedOAuthAccount[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const response = await readConnectedOAuthAccounts();

        if (!response.success) {
          throw new Error("Failed to fetch connected accounts");
        }

        const data: ConnectedOAuthAccount[] = response.data.map(account => ({
          ...account,
          // Set 'name' for display purposes based on account_type
          name: account.account_type === "Gmail" ? account.connected_email! : account.displayName!,
        }));

        console.log("Fetched connected accounts data:", data);
        setConnectedAccounts(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load accounts", {
          description: "Could not fetch the list of connected accounts.",
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, []); // Run once on mount

  // Function to handle the disconnection
  const handleDisconnect = async (account: ConnectedOAuthAccount) => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const confirmation = window.confirm(
      `Are you sure you want to disconnect the ${account.account_type} account "${account.name}"?`
    );
    if (!confirmation) {
      return;
    }

    try {
      const endpoint = `/api/admin/disconnect-${account.account_type.toLowerCase()}?id=${account.id}`;
      const response = await fetch(endpoint,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API disconnection error:", response.status, errorData);
        throw new Error(errorData.message || "Failed to disconnect account");
      }

      // Optimistically update the UI by filtering out the disconnected account
      setConnectedAccounts((prevAccounts) =>
        prevAccounts.filter((prevAccount) => prevAccount.id !== account.id)
      );

      toast.success("Account Disconnected", {
        description: `Successfully unlinked ${account.name} (${account.account_type}).`,
      });
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection Failed", {
        description: `Could not unlink this account. Please try again.`,
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
        description: "Your Gmail account has been successfully linked.",
      });
      // No longer needs to be async
      startTransition(async () => {
        setIsLoading(true);
        try {
          const response = await readConnectedOAuthAccounts();
          if (!response.success) {
            throw new Error("Failed to fetch connected accounts");
          }
          const data: ConnectedOAuthAccount[] = response.data.map(account => ({
            ...account,
            name: account.account_type === "Gmail" ? account.connected_email! : account.displayName!,
          }));
          setConnectedAccounts(data);
        } catch (err) {
          console.error(err);
          toast.error("Failed to refresh accounts", {
            description: "Could not refresh the list of connected accounts.",
          });
        } finally {
          setIsLoading(false);
        }
      });
      const newUrlGmail = new URL(window.location.href);
      newUrlGmail.searchParams.delete("success");
      router.replace(newUrlGmail.toString());
    } else if (success === "fitbit_connected") {
      toast.success("Fitbit Account Connected!", {
        description: "Your Fitbit account has been successfully linked.",
      });
      // No longer needs to be async
      startTransition(async () => {
        setIsLoading(true);
        try {
          const response = await readConnectedOAuthAccounts();
          if (!response.success) {
            throw new Error("Failed to fetch connected accounts");
          }
          const data: ConnectedOAuthAccount[] = response.data.map(account => ({
            ...account,
            name: account.account_type === "Gmail" ? account.connected_email! : account.displayName!,
          }));
          setConnectedAccounts(data);
        } catch (err) {
          console.error(err);
          toast.error("Failed to refresh accounts", {
            description: "Could not refresh the list of connected accounts.",
          });
        } finally {
          setIsLoading(false);
        }
      });
      const newUrlFitbit = new URL(window.location.href);
      newUrlFitbit.searchParams.delete("success");
      router.replace(newUrlFitbit.toString());
    } else if (error) {
      const errorMessage =
        errorMessages[error as keyof typeof errorMessages] ||
        "An unknown error occurred.";
      toast.error("Connection Failed!", {
        description: details
          ? `${errorMessage} Details: ${details}`
          : errorMessage,
      });
      // Remove error params from URL
      const newUrlError = new URL(window.location.href);
      newUrlError.searchParams.delete("error");
      newUrlError.searchParams.delete("details");
      router.replace(newUrlError.toString());
    }
  }, [searchParams, router, startTransition, setIsLoading]); // Add new dependencies

  // This useEffect fetches the accounts on the initial page load
  // This useEffect is now redundant as fetchConnectedAccounts is called in the first useEffect
  // useEffect(() => {
  //   fetchConnectedAccounts();
  // }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">OAuth Settings</h1>

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
            Manage the list of all accounts connected to your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching && <p>Loading connected accounts...</p>}
          {!isFetching && connectedAccounts.length === 0 && (
            <p>No accounts are currently connected.</p>
          )}
          {!isFetching && connectedAccounts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Account Identifier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.account_type}
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.account_type === "Gmail" ? account.connected_email : account.displayName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          handleDisconnect(account)
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
}

export default EmailAuth;
