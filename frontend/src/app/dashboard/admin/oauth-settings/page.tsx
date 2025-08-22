// ./app/dashboard/admin/oauth-settings/page.tsx
// This is a server component by default

import { Suspense } from "react";
import EmailAuth from "@/components/dashboard/club/email-auth";

export default function OauthSettingsPage() {
  return (
    <Suspense fallback={<div>Loading OAuth settings...</div>}>
      <div>
        <EmailAuth />
      </div>
    </Suspense>
  );
}
