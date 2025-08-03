// ./app/dashboard/club/email_auth/page.tsx
// This is a server component by default

import { Suspense } from "react";
import EmailAuth from "@/components/dashboard/club/email-auth";

export default function EmailAuthPage() {
  return (
    <Suspense fallback={<div>Loading email authentication...</div>}>
      <div>
        <EmailAuth />
      </div>
    </Suspense>
  );
}
