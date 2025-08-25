"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readClient } from "@/server-actions/client/actions";
import { useState, useEffect } from "react";
import type { Client } from "@/server-actions/client/types";
import { Loading } from "@/components/ui/loading";

interface ProfileCardProps {
  auth_id: string;
}

export function ProfileCard({ auth_id }: ProfileCardProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!auth_id || auth_id === "UNDEFINED") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await readClient(auth_id);
        if (result.success) {
          setClient(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load client data");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [auth_id]);

  // Test if avatar URL is accessible (only for HTTP URLs, not base64)
  useEffect(() => {
    if (client?.avatarUrl &&
      (client.avatarUrl.startsWith('http://') || client.avatarUrl.startsWith('https://'))) {

      // Add a small delay to avoid rapid successive requests
      const timeoutId = setTimeout(() => {
        if (client.avatarUrl) { // Ensure URL is not null
          fetch(client.avatarUrl, { method: 'HEAD' })
            .then(response => {
              if (response.status === 429) {
                // Rate limited - will use fallback
              }
            })
            .catch(error => {
              // Handle fetch errors silently
            });
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [client?.avatarUrl]);

  if (loading) {
    return (
      <Loading
        title="Loading Profile"
        description="Please wait..."
        size="sm"
      />
    );
  }

  if (!auth_id || auth_id === "UNDEFINED") {
    return (
      <Card className="w-full max-w-sm bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">User Not Found</CardTitle>
          <CardDescription>Unable to retrieve client.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !client) {
    return (
      <Card className="w-full max-w-sm bg-card shadow-lg hover:shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">Client Not Found</CardTitle>
          <CardDescription>No client data available.</CardDescription>
          {error && (
            <p className="text-red-500 text-sm mt-2">
              Error: {error}
            </p>
          )}
        </CardHeader>
      </Card>
    );
  }

  // Extract contact information
  const contactInfo = client.contactInfo || [];
  const primaryPhone = contactInfo.find(item => item.type === "phone" && item.primary)?.value;
  const primaryEmail = contactInfo.find(item => item.type === "email" && item.primary)?.value;

  // Construct full name
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || "User";

  // Check if avatar is rate limited or has other issues
  const isAvatarRateLimited = client?.avatarUrl &&
    (client.avatarUrl.includes('googleusercontent.com') || client.avatarUrl.includes('s96-c'));

  // Validate avatar URL - support both HTTP URLs and base64 data URLs
  const isValidAvatarUrl = client?.avatarUrl &&
    (client.avatarUrl.startsWith('http://') ||
      client.avatarUrl.startsWith('https://') ||
      client.avatarUrl.startsWith('data:'));

  // Use fallback if avatar is invalid or rate limited
  const shouldUseFallback = !isValidAvatarUrl || isAvatarRateLimited;

  return (
    <Card className="w-full bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-4 border-2 border-gray-300">
          <AvatarImage
            src={!shouldUseFallback ? client.avatarUrl! : "https://via.placeholder.com/96x96/3b82f6/ffffff?text=U"}
            alt={fullName}
            style={{ objectFit: 'cover' }}
          />
          <AvatarFallback className="text-2xl font-semibold bg-blue-500 text-white">
            {client.firstName?.charAt(0) || client.lastName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{fullName}</CardTitle>
        {client.gender && (
          <CardDescription className="text-sm text-muted-foreground">
            {client.gender}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5 min-w-0">
            <p className="text-sm font-medium leading-none">Phone:</p>
            <p className="text-sm text-muted-foreground truncate">
              {primaryPhone || "No phone number provided"}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5 min-w-0">
            <p className="text-sm font-medium leading-none">Email:</p>
            <p className="text-sm text-muted-foreground truncate">
              {primaryEmail || "No email provided"}
            </p>
          </div>
          {client.birthDate && (
            <div className="flex flex-col space-y-1.5 min-w-0">
              <p className="text-sm font-medium leading-none">Birth Date:</p>
              <p className="text-sm text-muted-foreground truncate">
                {new Date(client.birthDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCard;
