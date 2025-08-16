"use client";

import { useState, useEffect } from "react";
import { ProfileEditForm } from "@/components/profile/profile-edit";
import { readClient, updateClient } from "@/server-actions/client/actions";
import type { Client } from "@/server-actions/client/types";
import { ProfileFormValues } from "@/components/profile/schema";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const Profile = () => {
  const { data: session } = useSession();

  const [initialData, setInitialData] = useState<Client | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await readClient(userId);
        if (result.success) {
          setInitialData(result.data);
        } else {
          toast.error("Failed to load profile: " + result.message);
        }
      } catch (error) {
        toast.error("An unexpected error occurred while loading profile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userId) {
      toast.error("User not authenticated.");
      return;
    }
    setIsLoading(true);
    try {
      const newClient: Client = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate ?? null,
        gender: data.gender ?? null,
        current: data.current,
        disabled: data.disabled,
        avatarUrl: data.avatarUrl ?? null,
        contactInfo: data.contactInfo ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
        roles: data.roles,
        authId: data.authId,
      };
      const result = await updateClient(userId, newClient);
      if (result.success) {
        toast.success("Profile updated successfully!");
        setInitialData(result.data);
      } else {
        toast.error("Failed to update profile: " + result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred while updating profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = () => {
    // Implement cancel logic, e.g., navigate back or reset form
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 items-center justify-center min-h-[100vh]">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!initialData && !isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 items-center justify-center min-h-[100vh]">
        <p>No profile found or an error occurred. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          {initialData && (
            <ProfileEditForm
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onCancel}
              isLoading={isLoading}
            />
          )}
          {!initialData && <h1>WTF</h1>}
        </div>
      </div>
    </>
  );
};

export default Profile;
