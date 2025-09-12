import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  readClientHabitsByDate,
  DailyHabit,
} from "@/server-actions/client/habits/actions";
import { HabitDailyCard } from "@/components/habits/habit-daily-card";
import { Loading } from "@/components/ui/loading";

interface HabitOverViewDaily {
  clientId: string | undefined;
  selectedDate: Date;
}

const HabitOverViewDaily = ({ selectedDate, clientId }: HabitOverViewDaily) => {
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setDailyHabits([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const result = await readClientHabitsByDate(clientId, selectedDate);

      if (!result.success) {
        toast.error("Failed to fetch daily habit data");
        setDailyHabits([]);
      } else {
        setDailyHabits(result.data);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [selectedDate, clientId]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-sm space-y-4">
        {isLoading ? (
          <Loading
            title="Loading Client Habits"
            description="Fetching client's habit data..."
            size="sm"
          />
        ) : dailyHabits.length > 0 ? (
          dailyHabits.map((habit) => (
            <HabitDailyCard key={habit.programmeHabitId} habit={habit} />
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
