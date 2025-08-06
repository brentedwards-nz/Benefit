// frontend/app/dashboard/page.tsx
import { ProfileCard } from "@/components/cards/profile-card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const auth_id = session?.user?.id || "UNDEFINED";
  console.log("Dashboard page loaded:", auth_id);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl">
            <ProfileCard auth_id={auth_id} />
          </div>
          <div className="bg-muted/50 rounded-xl" />
          <div className="bg-muted/50 rounded-xl" />
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
      </div>
    </>
  );
}
