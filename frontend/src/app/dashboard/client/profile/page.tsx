"use client";

import { useState, useEffect } from "react";
import { ProfileEditForm } from "@/components/profile/profile-edit";
import { readClient, updateClient } from "@/server-actions/client/actions";
import type { Client } from "@/server-actions/client/types";
import { ProfileFormValues } from "@/components/profile/schema";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/ui/loading";

const Profile = () => {
  const { data: session, status } = useSession();

  const [initialData, setInitialData] = useState<Client | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    } else {
      // No session or user ID found
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
      // Transform ProfileFormValues to Client type for update
      const updateData: Client = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        current: data.current,
        disabled: data.disabled,
        avatarUrl: data.avatarUrl || null,
        contactInfo: data.contactInfo || null,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        roles: data.roles,
        authId: data.authId,
      };

      const result = await updateClient(userId, updateData);
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

  if (isLoading || !initialData) {
    return (
      <Loading
        title="Loading Profile"
        description="Please wait while we load your profile..."
        steps={[
          "Authenticating user session",
          "Loading profile data",
          "Preparing profile form"
        ]}
        size="md"
      />
    );
  }

  if (!initialData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 items-center justify-center min-h-[100vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p>No profile found or an error occurred. Please try again.</p>
          {!userId && (
            <div className="mt-4">
              <a
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
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
        </div>
      </div>
    </>
  );
};

export default Profile;
