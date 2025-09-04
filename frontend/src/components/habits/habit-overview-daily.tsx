import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  readClientHabitsByDate,
  DailyHabit,
} from "@/server-actions/client/habits/actions";

interface HabitOverViewDaily {
  clientId: string | undefined;
  selectedDate: Date;
}

const HabitOverViewDaily = ({ selectedDate, clientId }: HabitOverViewDaily) => {
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);

  useEffect(() => {
    if (!clientId) {
      setDailyHabits([]);
      return;
    }

    const fetchData = async () => {
      const result = await readClientHabitsByDate(clientId, selectedDate);

      if (!result.success) {
        toast.error("Failed to fetch daily habit data");
        setDailyHabits([]);
        return;
      }

      setDailyHabits(result.data);
    };

    fetchData();
  }, [selectedDate, clientId]);

  return (
    <div className="flex items-center flex-col">
      <div className="w-full">Daily: {selectedDate.toLocaleDateString()}</div>
      <div>
        <pre className="w-full text-white">
          {JSON.stringify(dailyHabits, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default HabitOverViewDaily;
