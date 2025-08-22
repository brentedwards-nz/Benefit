"use client";

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { Loading } from '@/components/ui/loading';

const TrainerDashboardPage = () => {
  return (
    <ProtectedRoute requiredRoles={[UserRole.Trainer, UserRole.Admin, UserRole.SystemAdmin]}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Trainer Dashboard</h1>
        <p className="text-center text-muted-foreground">Welcome to your trainer dashboard. More content will be added here soon.</p>
      </div>
    </ProtectedRoute>
  );
};

export default function TrainerDashboardPageWrapper() {
  return (
    <Suspense fallback={<Loading title="Loading Trainer Dashboard" description="Preparing your trainer view..." />}>
      <TrainerDashboardPage />
    </Suspense>
  );
}
