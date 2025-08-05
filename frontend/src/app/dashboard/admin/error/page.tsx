// src/app/dashboard/club/error/page.tsx
// This is a Server Component by default.

import { Suspense } from "react";
import ErrorContent from "./ErrorContent";

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
