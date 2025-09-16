"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { HabitOverView } from "@/components/habits/habit-overview";
import { toast } from "sonner";
import { addDays, isSameDay } from "date-fns";
import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import { readClient } from "@/server-actions/client/actions";

import { useQuery } from "@tanstack/react-query";
import { Session } from "next-auth";
import { getStartOfWeek } from "@/utils/date-utils";

async function getUser(session: Session | null) {
  if (!session?.user?.id) {
    throw new Error("No user ID found in session");
  }
  const auth_id = session.user.id;
  const res = await readClient(auth_id);
  if (!res.success) {
    throw new Error("Could not get user");
  }
  return res.data;
}

async function getUserHabits(selectedClientId: string, startDate?: Date) {
  if (!selectedClientId) {
    throw new Error("No client ID provided");
  }

  if (!startDate) {
    startDate = new Date();
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await readClientHabitsByDateRange(
    selectedClientId,
    getStartOfWeek(startDate).toISOString().split("T")[0],
    addDays(getStartOfWeek(startDate), 27).toISOString().split("T")[0],
    timezone
  );

  if (!res.success) {
    throw new Error("Could not get client habits");
  }
  return res.data;
}

const ClientHabitsPage = () => {
  const router = useRouter();

  // SearchParams
  const searchParams = useSearchParams();

  // State variables
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingClientHabits, setIsLoadingClientHabits] = useState(false);

  // Use Effect
  const anchorDateParam = searchParams.get("date");
  useEffect(() => {
    if (anchorDateParam) {
      const d = new Date(anchorDateParam);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    }
  }, [anchorDateParam]);

  const {
    data: selectedClient,
    isLoading: isLoadingSelectedClient,
    error: errorSelectedClient,
  } = useQuery({
    queryKey: ["getUserId", session?.user?.id],
    queryFn: () => getUser(session),
    enabled: !!(session && session.user && session.user.id),
  });

  const {
    data: habitOverViewProps,
    isLoading: isLoadingHabitOverViewProps,
    error: errorHabitOverViewProps,
  } = useQuery({
    queryKey: ["getUserHabits", selectedClient?.id || "", currentDate],
    queryFn: () => getUserHabits(selectedClient?.id || "", currentDate),
    enabled: !!(selectedClient && selectedClient.id),
  });

  

  // Navigate to previous 4 weeks
  const goToPreviousWeeks = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 28); // Go back 4 weeks
    setCurrentDate(newDate);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7); // Go back 1 week
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7); // Go forward 1 week
    setCurrentDate(newDate);
  };

  // Navigate to next 4 weeks
  const goToNextWeeks = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 28); // Go forward 4 weeks
    setCurrentDate(newDate);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    // Determine the 4-week window currently shown
    const topWeekStart = getStartOfWeek(currentDate);
    const windowStart = new Date(topWeekStart);
    const windowEnd = new Date(topWeekStart);
    windowEnd.setDate(windowEnd.getDate() + 27);
    const inWindow = today >= windowStart && today <= windowEnd;
    if (inWindow) return; // Already visible; no change
    setCurrentDate(new Date());
  };

  // Handle day click to redirect to weekly view
  const handleDayClick = (clickedDate: Date) => {
    const day = habitOverViewProps?.HabitDayData.find((d) =>
      isSameDay(d.date, clickedDate)
    );
    if (!day) {
      // This should not happen if the clickedDate comes from HabitOverView
      console.error("DayData not found for clicked date:", clickedDate);
      return;
    }

    // Redirect to weekly page with the selected date and clientId
    const dateString = day.date.toISOString().split("T")[0];
    // Disallow selecting dates more than 7 days ahead from today
    const clickedDateOnly = new Date(dateString);
    const todayOnly = new Date(new Date().toISOString().split("T")[0]);
    const diffDays = Math.floor(
      (clickedDateOnly.getTime() - todayOnly.getTime()) / 86400000
    );
    if (diffDays > 7) {
      toast.info(
        "That date is too far in the future. You can only view up to 7 days ahead."
      );
      return;
    }
    const queryParams = new URLSearchParams();
    queryParams.set("date", dateString);
    router.push(`/dashboard/client/habits/weekly?${queryParams.toString()}`);
  };

  // ---------- Loading state -----------------------------------------------
  if (isLoadingClientHabits) {
    return (
      <Loading
        title="Loading Habits"
        description="Setting up your habit tracker..."
        steps={[]}
        size="lg"
      />
    );
  }

  // ---------- Main render -------------------------------------------------
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.Client, UserRole.Admin, UserRole.SystemAdmin]}
    >
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center mb-2">
            Habits Overview
          </h1>

          {/* Month label centered above controls */}
          <div className="text-center mb-2">
            <div className="text-sm font-medium">
              {currentDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeeks}
                className="flex items-center justify-center w-10 h-10 p-0"
                title="Previous 4 weeks"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="flex items-center justify-center w-10 h-10 p-0"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-10 inline-flex items-center justify-center rounded-full px-4 text-xs font-semibold"
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="flex items-center justify-center w-10 h-10 p-0"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeeks}
                className="flex items-center justify-center w-10 h-10 p-0"
                title="Next 4 weeks"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-3">
          {/* Calendar Grid - Centered with 10px gaps and aligned headers */}
          <div className="flex justify-center">
            <div className="w-full">
              {habitOverViewProps &&
                habitOverViewProps.HabitDayData.length > 0 &&
                Array.from(
                  {
                    length: Math.ceil(
                      habitOverViewProps.HabitDayData.length / 7
                    ),
                  },
                  (_, i) => (
                    <HabitOverView
                      key={i}
                      days={habitOverViewProps.HabitDayData.slice(
                        i * 7,
                        (i + 1) * 7
                      )}
                      selectedDate={currentDate}
                      showCompletionRate={false}
                      showDayLabels={i === 0} // Only show day labels for the first week
                      onDateSelected={handleDayClick}
                    />
                  )
                )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {habitOverViewProps && habitOverViewProps.HabitDayData.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              No habits assigned yet. Contact your programme administrator.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default function ClientHabitsPageWrapper() {
  return (
    <Suspense
      fallback={
        <Loading title="Loading Habits" description="Preparing calendar..." />
      }
    >
      <ClientHabitsPage />
    </Suspense>
  );
}