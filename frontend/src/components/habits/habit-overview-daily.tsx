import { toast } from "sonner";
import {
  readClientHabitsByDate,
  DailyHabit,
} from "@/server-actions/client/habits/actions";
import { HabitDailyCard } from "@/components/habits/habit-daily-card";
import { Loading } from "@/components/ui/loading";
import { useQuery } from "@tanstack/react-query";

interface HabitOverViewDaily {
  clientId: string | undefined;
  selectedDate: Date;
  onHabitUpdated: () => void;
}

// External function to fetch daily habits
const fetchDailyHabits = async (
  clientId: string | undefined,
  selectedDate: Date
) => {
  if (!clientId) {
    return [];
  }

  const result = await readClientHabitsByDate(
    clientId,
    selectedDate.toISOString().split("T")[0]
  );
  if (!result.success) {
    toast.error("Failed to fetch daily habit data");
    return [];
  }
  return result.data;
};

const HabitOverViewDaily = ({
  selectedDate,
  clientId,
  onHabitUpdated,
}: HabitOverViewDaily) => {
  const {
    data: dailyHabits,
    isLoading,
    refetch,
  } = useQuery<DailyHabit[]>({
    queryKey: ["habitOverViewDaily", clientId, selectedDate.toISOString()],
    queryFn: () => fetchDailyHabits(clientId, selectedDate),
    enabled: !!clientId,
  });

  const handleHabitUpdated = () => {
    refetch();
    onHabitUpdated();
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* <div className="w-full max-w-sm space-y-4">
        <pre>{JSON.stringify(dailyHabits, null, 2)}</pre>
      </div> */}
      <div className="w-full max-w-sm space-y-4">
        {isLoading ? (
          <Loading
            title="Loading Client Habits"
            description="Fetching client's habit data..."
            size="sm"
          />
        ) : dailyHabits && dailyHabits.length > 0 ? (
          dailyHabits.map((habit) => (
            <HabitDailyCard
              key={habit.clientHabitId}
              habit={habit}
              onHabitUpdated={handleHabitUpdated}
            />
          ))
        ) : (
          <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
            <p>No habits scheduled for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitOverViewDaily;
