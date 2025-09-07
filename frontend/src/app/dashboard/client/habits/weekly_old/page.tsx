"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { WeekView, ClientHabits, ProgrammeHabit } from "@/components/habits/week-view";
import { toast } from "sonner";

interface DayData {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  completionRate: number; // 0-1
}

interface WeekData {
  days: DayData[];
}

const WeeklyHabitsPageContent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [programmeHabits, setProgrammeHabits] = useState<ProgrammeHabit[]>([]);
  const [clientHabits, setClientHabits] = useState<ClientHabits[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [autoSelectWeek, setAutoSelectWeek] = useState(true); // Flag to control auto-selection
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get client ID from search params or fall back to current user
  const clientId = searchParams.get("clientId") || session?.user?.id;
  const isSelf =
    !searchParams.get("clientId") ||
    searchParams.get("clientId") === session?.user?.id;

  // Get date from search params if provided
  const dateParam = searchParams.get("date");

  // Update currentDate when dateParam changes
  useEffect(() => {
    if (dateParam) {
      const newDate = new Date(dateParam);
      setCurrentDate(newDate);
    }
  }, [dateParam]);

  // Get the start of the week (Monday) for a given date
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate 4 weeks of data starting from the given date
  const generateWeeks = (startDate: Date, clientHabits: ClientHabits[]): WeekData[] => {
    const weeks: WeekData[] = [];
    const startOfWeek = getStartOfWeek(startDate);

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() + week * 7);

      const days: DayData[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + day);

        // Get habit completions for this specific date
        const dateString = currentDate.toISOString().split("T")[0];
        const dayCompletions = clientHabits.filter(
          (c) => c.habitDate.split("T")[0] === dateString
        );

        const completedCount = dayCompletions.filter((c) => c.completed).length;
        const completionRate =
          programmeHabits.length > 0
            ? completedCount / programmeHabits.length
            : 0;

        days.push({
          date: currentDate,
          dayNumber: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === startDate.getMonth(),
          completionRate,
        });
      }

      weeks.push({ days });
    }

    return weeks;
  };

  // Handle habit completion toggle
  // completed param reused as intent for +/-: true => +1, false => -1
  const handleHabitToggle = async (
    programmeHabitId: string,
    date: Date,
    completed: boolean
  ) => {
    if (isSubmitting) return;
    const dateString = date.toISOString().split("T")[0];

    // Block toggling completion for future dates
    const clickedDateOnly = new Date(dateString);
    const todayOnly = new Date(new Date().toISOString().split("T")[0]);
    if (clickedDateOnly.getTime() > todayOnly.getTime()) {
      toast.error("You cannot complete habits for a future date.");
      return;
    }

    // Block toggling completion more than 3 days in the past
    const diffPastDays = Math.floor(
      (todayOnly.getTime() - clickedDateOnly.getTime()) / 86400000
    );
    if (diffPastDays > 3) {
      toast.error("You cannot edit habits more than 3 days in the past.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/client/habits/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeHabitId,
          habitDate: dateString,
          // Interpret completed as +1 or -1 intent
          delta: completed ? 1 : -1,
          clientId,
        }),
      });

      if (response.ok) {
        // Refresh the data for the full 4-week period to update the overview
        const startDate = getStartOfWeek(currentDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 27); // 4 weeks

        const completionsResponse = await fetch(
          `/api/client/habits/completions?startDate=${
            startDate.toISOString().split("T")[0]
          }&endDate=${endDate.toISOString().split("T")[0]}&clientId=${clientId}`
        );

        if (completionsResponse.ok) {
          const completionsData = await completionsResponse.json();
          setClientHabits(completionsData);
        }
      } else {
        const errorData = await response.json();
        console.error("Habit toggle failed:", response.status, errorData);
        toast.error(
          `Failed to update habit: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error updating habit completion:", error);
      toast.error("Error updating habit completion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    setSelectedWeek(null); // Reset selected week
    const queryParams = new URLSearchParams();
    if (clientId && clientId !== session?.user?.id) {
      queryParams.set("clientId", clientId);
    }
    queryParams.set("date", newDate.toISOString().split("T")[0]);
    router.push(`/dashboard/client/habits/weekly?${queryParams.toString()}`);
  };

  // Go back to 4-week view
  const goBackToOverview = () => {
    // Navigate back to the overview page
    const queryParams = new URLSearchParams();
    if (clientId && clientId !== session?.user?.id) {
      queryParams.set("clientId", clientId);
    }

    router.push(
      `/dashboard/client/habits${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Wait for session to be available
        if (!clientId) {
          return;
        }

        // Fetch programme habits
        const habitsResponse = await fetch(
          `/api/client/habits?clientId=${clientId}`
        );
        if (habitsResponse.ok) {
          const habitsData = await habitsResponse.json();
          setProgrammeHabits(habitsData);
        }

        // Fetch habit completions for the current 4-week period
        const startDate = getStartOfWeek(currentDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 27); // 4 weeks

        const completionsResponse = await fetch(
          `/api/client/habits/completions?startDate=${
            startDate.toISOString().split("T")[0]
          }&endDate=${endDate.toISOString().split("T")[0]}&clientId=${clientId}`
        );

        if (completionsResponse.ok) {
          const completionsData = await completionsResponse.json();
          console.log(JSON.stringify(completionsData, null, 2));
          setClientHabits(completionsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate, clientId]);

  useEffect(() => {
    if (programmeHabits.length > 0) {
      setWeeks(generateWeeks(currentDate, clientHabits));
    }
  }, [currentDate, programmeHabits, clientHabits]);

  // Auto-select week and date when data is loaded
  useEffect(() => {
    if (programmeHabits.length > 0 && weeks.length > 0) {
      let targetDate: Date;
      let targetWeekIndex: number = -1;

      if (dateParam) {
        // Use the date from URL parameter
        targetDate = new Date(dateParam);
        console.log(
          "Looking for date:",
          dateParam,
          "Target date:",
          targetDate.toISOString().split("T")[0]
        );
        targetWeekIndex = weeks.findIndex((week) =>
          week.days.some(
            (day) =>
              day.date.toISOString().split("T")[0] ===
              targetDate.toISOString().split("T")[0]
          )
        );
        console.log("Found week index:", targetWeekIndex);
      } else if (autoSelectWeek) {
        // Fall back to current week if no date parameter
        targetDate = new Date();
        targetWeekIndex = weeks.findIndex((week) =>
          week.days.some(
            (day) =>
              day.date.toISOString().split("T")[0] ===
              targetDate.toISOString().split("T")[0]
          )
        );
      }

      if (targetWeekIndex !== -1) {
        const targetWeek = weeks[targetWeekIndex];
        console.log(
          "Target week days:",
          targetWeek.days.map((d) => d.date.toISOString().split("T")[0])
        );

        const targetDayInWeek = targetWeek.days.find(
          (day) =>
            day.date.toISOString().split("T")[0] ===
            targetDate.toISOString().split("T")[0]
        );

        console.log(
          "Target day found:",
          targetDayInWeek
            ? targetDayInWeek.date.toISOString().split("T")[0]
            : "NOT FOUND"
        );

        setSelectedWeek(targetWeek);
        // Always use the target date if it exists, otherwise fall back to first day of week
        if (targetDayInWeek) {
          setSelectedDate(targetDayInWeek.date);
        } else {
          setSelectedDate(targetWeek.days[0].date);
        }
      }
    }
  }, [autoSelectWeek, weeks, programmeHabits, dateParam]);

  if (loading) {
    return (
      <Loading
        title="Loading Weekly Habits"
        description="Setting up your weekly habit tracker..."
        steps={[]}
        size="lg"
      />
    );
  }

  // Week view component
  if (selectedWeek && selectedDate) {
    return (
      <ProtectedRoute
        requiredRoles={[UserRole.Client, UserRole.Admin, UserRole.SystemAdmin]}
      >
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goBackToOverview}
              aria-label="Back to overview"
              className="p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(-7)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold mx-4">
                {selectedWeek.days[0]?.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                -
                {selectedWeek.days[
                  selectedWeek.days.length - 1
                ]?.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(7)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-10"></div> {/* Placeholder for alignment */}
          </div>
          <WeekView
            selectedWeek={selectedWeek}
            selectedDate={selectedDate}
            programmeHabits={programmeHabits}
            habitCompletions={clientHabits}
            isSelf={isSelf}
            onHabitToggle={handleHabitToggle}
          />
          {isSubmitting && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <div className="text-sm text-muted-foreground">
                  Saving your update...
                </div>
              </div>
            </div>
          )}
        </div>
      </ProtectedRoute>
    );
  }

  // If no week is selected, show loading state
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.Client, UserRole.Admin, UserRole.SystemAdmin]}
    >
      <div className="container mx-auto p-4">
        <Loading
          title="Loading Weekly View"
          description="Preparing your weekly habit tracker..."
          size="lg"
        />
      </div>
    </ProtectedRoute>
  );
};

const WeeklyHabitsPage = () => {
  return (
    <Suspense
      fallback={
        <Loading
          title="Loading..."
          description="Preparing weekly habits view..."
        />
      }
    >
      <WeeklyHabitsPageContent />
    </Suspense>
  );
};

export default WeeklyHabitsPage;