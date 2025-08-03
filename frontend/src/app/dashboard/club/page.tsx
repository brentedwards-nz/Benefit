// app/clubs/page.tsx (assuming this is your file structure)
// NO "use client" directive here

import Clubs, { ClubsProps } from "@/components/club/club-list";
import AIChat from "@/components/ai/ai-chat"; // If AIChat also needs "use client", mark it as such.
import { readClubs } from "@/server-actions/clubs/actions";
import { Club } from "@/server-actions/clubs/types";
import { ClubCardProps } from "@/components/cards/club-card";

const transformClubs = (clubsData: Club[]): ClubCardProps[] => {
  return clubsData.map(
    (club: Club) =>
      ({
        club_id: club.club_id,
        club_name: club.club_name,
        club_address: club.club_address,
        club_phone: club.club_phone,
        current: club.current,
        disabled: club.disabled,
        created_at: club.created_at,
        club_avatar: "",
      } as ClubCardProps)
  );
};

export default async function ClubPage() {
  // Marked as async
  let clubs: ClubCardProps[] = [];
  let error: string | null = null;

  try {
    const clubsResult = await readClubs(); // Await directly here!

    if (clubsResult.success) {
      if (Array.isArray(clubsResult.data)) {
        clubs = transformClubs(clubsResult.data);
      } else {
        console.error(
          "readClubs did not return an array for data:",
          clubsResult.data
        );
        error = "Invalid data format received from server.";
      }
    } else {
      error = clubsResult.message || "Failed to fetch clubs.";
      console.error("Failed to fetch clubs:", clubsResult.message);
    }
  } catch (err: any) {
    console.error("Error fetching clubs:", err);
    error = err.message || "An unexpected error occurred while loading clubs.";
  }

  // Handle loading and error states within the component's render
  // For Server Components, initial loading state can be handled by a `loading.tsx` file in the same directory.
  // For errors, you might consider an `error.tsx` boundary.

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

  if (clubs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">No clubs found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <Clubs clubs={clubs} />{" "}
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <AIChat />{" "}
        </div>
      </div>
    </div>
  );
}
