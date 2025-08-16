"use client";

import { ProfileCard } from "@/components/cards/profile-card";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loading } from "@/components/ui/loading";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [auth_id, setAuth_id] = useState<string>("UNDEFINED");

  useEffect(() => {
    if (session?.user?.id) {
      setAuth_id(session.user.id);
    } else {
      setAuth_id("UNDEFINED");
    }
  }, [session]);

  console.log("Dashboard page loaded - Session:", session);
  console.log("Dashboard page loaded - Auth ID:", auth_id);
  console.log("Dashboard page loaded - User:", session?.user);

  if (status === "loading") {
    return (
      <Loading
        title="Loading Dashboard"
        description="Setting up your personalized experience..."
        steps={[
          "Authenticating user session",
          "Loading profile data",
          "Preparing dashboard"
        ]}
        size="lg"
      />
    );
  }

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
