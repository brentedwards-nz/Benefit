// src/components/profile-editor.tsx
"use client"; // This is a client component

import { useState, useEffect, FormEvent } from "react";
// import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { useSession } from "next-auth/react";

// Define the type for the profile data
interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null; // Use string for date input type="date"
}

interface ProfileEditorProps {
  auth_id: string;
}

export default function ProfileEditor({ auth_id }: ProfileEditorProps) {
  // const supabase = createBrowserSupabaseClient();
  const { data: session } = useSession();

  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    birth_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const [user, setUser] = useState<any>(null); // To store the authenticated user

  // Function to fetch initial profile data
  useEffect(() => {
    async function getProfileAndUser() {
      setLoading(true);
      setError(null);

      // TODO: Implement with NextAuth and Prisma
      // const {
      //   data: { user: currentUser },
      // } = await supabase.auth.getUser();
      // setUser(currentUser); // Set the user state

      if (!session?.user) {
        setLoading(false);
        // Do NOT redirect here. The parent page/middleware should handle unauthenticated access.
        // This component simply indicates it needs a logged-in user.
        return;
      }

      // TODO: Implement profile fetching with Prisma
      // const { data, error } = await supabase
      //   .from("profiles")
      //   .select("first_name, last_name, birth_date")
      //   .eq("auth_id", auth_id)
      //   .single(); // Use single() because 'id' is unique

      // if (error) {
      //   console.error("Error fetching profile:", error);
      //   setError(`Failed to load profile: ${error.message}`);
      // } else if (data) {
      //   setProfile({
      //     first_name: data.first_name,
      //     last_name: data.last_name,
      //     birth_date: data.birth_date,
      //   });
      // }
      setLoading(false);
    }

    getProfileAndUser();
  }, [session]); // Re-run if session changes

  // Function to handle form submission (updating profile)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!session?.user) {
      // Check user again before saving
      setError("No authenticated user found to save profile.");
      setSaving(false);
      return;
    }

    // TODO: Implement profile update with Prisma
    // const { error: updateError } = await supabase
    //   .from("profiles")
    //   .update({
    //     first_name: profile.first_name,
    //     last_name: profile.last_name,
    //     birth_date: profile.birth_date,
    //   })
    //   .eq("auth_id", user.id); // Crucial: Update only the current user's profile

    // if (updateError) {
    //   console.error("Error updating profile:", updateError);
    //   setError(`Failed to update profile: ${updateError.message}`);
    // } else {
    //   setSuccess("Profile updated successfully!");
    // }
    setSuccess("Profile updated successfully!");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[200px]">
        {" "}
        {/* Min height for loading state */}
        <p className="text-xl text-gray-300">Loading profile data...</p>
      </div>
    );
  }

  return (
    // This div contains only the component's internal styling, not full page layout
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-teal-400">
        Edit Your Profile
      </h2>

      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && <p className="text-green-400 mb-4">{success}</p>}

        <div className="mb-4 text-left">
          <label
            htmlFor="first_name"
            className="block text-gray-300 text-sm font-bold mb-2"
          >
            First Name:
          </label>
          <input
            type="text"
            id="first_name"
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            value={profile.first_name || ""}
            onChange={(e) =>
              setProfile({ ...profile, first_name: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <div className="mb-4 text-left">
          <label
            htmlFor="last_name"
            className="block text-gray-300 text-sm font-bold mb-2"
          >
            Last Name:
          </label>
          <input
            type="text"
            id="last_name"
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            value={profile.last_name || ""}
            onChange={(e) =>
              setProfile({ ...profile, last_name: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <div className="mb-6 text-left">
          <label
            htmlFor="birth_date"
            className="block text-gray-300 text-sm font-bold mb-2"
          >
            Birth Date:
          </label>
          <input
            type="date"
            id="birth_date"
            className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            value={profile.birth_date || ""}
            onChange={(e) =>
              setProfile({ ...profile, birth_date: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
