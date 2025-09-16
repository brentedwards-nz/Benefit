"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import {
  HabitOverView,
  HabitOverViewProps,
} from "@/components/habits/habit-overview";
import { startOfDay, endOfDay } from "date-fns";

interface ClientHabitsSummaryProps {
  clientId: string;
  startDate: string;
  endDate: string;
}

export const ClientHabitsSummary = ({
  clientId,
  startDate,
  endDate,
}: ClientHabitsSummaryProps) => {
  const {
    data: habitOverViewProps,
    isLoading: isLoadingClientHabits,
    error: clientHabitsError,
  } = useQuery({
    queryKey: ["clientHabits", clientId, startDate, endDate],
    queryFn: async () => {
      if (!clientId) {
        return null;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const result = await readClientHabitsByDateRange(
        clientId,
        startDate,
        endDate,
        timezone
      );

      if (!result.success) {
        throw new Error(
          result.message || "No habit data found for the client."
        );
      }
      const viewProps: HabitOverViewProps = {
        days: result.data.HabitDayData,
        selectedDate: new Date(), // Use startDate directly
      };

      return viewProps;
    },
    enabled: !!clientId,
  });

  if (clientHabitsError) {
    console.error("Error fetching client habits:", clientHabitsError);
    toast.error("Failed to load client habits", {
      description:
        clientHabitsError.message || "Could not retrieve client habits.",
    });
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Client Habits Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingClientHabits ? (
          <Loading
            title="Loading Client Habits"
            description="Fetching client's habit data..."
            size="sm"
          />
        ) : habitOverViewProps && habitOverViewProps.days.length > 0 ? (
          <div>
            <HabitOverView
              days={habitOverViewProps.days}
              selectedDate={habitOverViewProps.selectedDate}
              showCompletionRate={true}
              showDayLabels={true}
            />
          </div>
        ) : (
          <p>No habit data found for this client.</p>
        )}
      </CardContent>
    </Card>
  );
};
