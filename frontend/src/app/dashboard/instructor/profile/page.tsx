"use client";

import { useState, useEffect } from "react";
import { ProfileEditForm } from "@/components/profile/profile-edit";
import { readProfile, updateProfile } from "@/server-actions/profile/actions";
import type { Profile } from "@/server-actions/profile/types";
import { ProfileFormValues } from "@/components/profile/schema";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

const Profile = () => {
  const supabase = createClient();

  const [initialData, setInitialData] = useState<Profile | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id);
    };

    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await readProfile(userId);
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
      const { primary_phone, primary_email, DateTime, ...updateData } = data;

      const newProfile: Profile = {
        auth_id: userId,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        full_name: "",
        birth_date: updateData?.birth_date ?? null,
        current: updateData.current,
        disabled: updateData.disabled,
        avatar_url: updateData.avatar_url ?? null,
        contact_info: updateData.contact_info ?? null,
        primary_phone: "",
        primary_email: "",
        DateTime: data.DateTime ?? null,
      };
      const result = await updateProfile(userId, newProfile);
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
