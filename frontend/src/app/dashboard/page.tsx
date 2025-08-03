// frontend/app/dashboard/page.tsx
import { ProfileCard } from "@/components/cards/profile-card";
import { createClient } from "@/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase.auth.getUser();
  const auth_id = userError || !user ? "UNDEFINED" : user.user.id;

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
