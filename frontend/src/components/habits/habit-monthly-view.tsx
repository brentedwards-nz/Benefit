import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { getDayColor } from "@/utils/general-utils";

export interface ClientHabits {
  id: string;
  habitDate: string;
  completed: boolean;
  timesDone?: number;
  programmeHabitId: string;
  programmeHabit: {
    id: string;
    programme: {
      id: string;
      name: string;
    };
    habit: {
      id: string;
      title: string;
    };
  };
  notes?: string;
}

export interface ProgrammeHabit {
  id: string;
  programme: {
    id: string;
    name: string;
    humanReadableId: string;
    startDate?: string | null;
    endDate?: string | null;
  };
  habit: {
    id: string;
    title: string;
  };
  frequencyPerDay?: number | null;
}

export interface DayData {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  completionRate: number; // 0-1
}

interface WeekData {
  days: DayData[];
}

export interface WeekViewProps {
  selectedWeek: WeekData;
  selectedDate: Date;
  programmeHabits: ProgrammeHabit[];
  habitCompletions: ClientHabits[];
  isSelf?: boolean;
  onHabitToggle: (
    programmeHabitId: string,
    date: Date,
    completed: boolean
  ) => void;
}

export const MonthlyView = ({
  selectedDate,
  programmeHabits,
  onHabitToggle,
}: WeekViewProps) => {
  // Use the selectedDate prop as the initial selected day
  const [selectedDay, setSelectedDay] = useState<Date | null>(selectedDate);

  // Update selected day when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedDay(selectedDate);
    }
  }, [selectedDate]);

  // Determine if the selected day is in the future or too far in the past (date-only)
  const todayOnlyTs = new Date(
    new Date().toISOString().split("T")[0]
  ).getTime();
  const selectedOnlyTs = selectedDay
    ? new Date(selectedDay.toISOString().split("T")[0]).getTime()
    : null;
  const isFutureSelectedDay =
    selectedOnlyTs !== null ? selectedOnlyTs > todayOnlyTs : false;
  const isMoreThan3DaysPast =
    selectedOnlyTs !== null
      ? (todayOnlyTs - selectedOnlyTs) / 86400000 > 3
      : false;
  const isDisabledForEdit = isFutureSelectedDay || isMoreThan3DaysPast;

  const isWithinProgramme = (programmeHabit: ProgrammeHabit, date: Date) => {
    const habitStartDate = programmeHabit.programme.startDate
      ? new Date(programmeHabit.programme.startDate)
      : null;
    const habitEndDate = programmeHabit.programme.endDate
      ? new Date(programmeHabit.programme.endDate)
      : null;

    if (!habitStartDate || !habitEndDate) {
      return true; // No specific dates, so it's always within
    }

    return date >= habitStartDate && date <= habitEndDate;
  };

  const isDayWithinAnyProgramme = (date: Date): boolean => {
    const dateOnly = new Date(date.toISOString().split("T")[0]);
    return programmeHabits.some((ph) => {
      const start = ph.programme?.startDate
        ? new Date(ph.programme.startDate)
        : null;
      const end = ph.programme?.endDate ? new Date(ph.programme.endDate) : null;
      if (!start || !end) return true;
      const d = dateOnly.getTime();
      const s = new Date(start.toISOString().split("T")[0]).getTime();
      const e = new Date(end.toISOString().split("T")[0]).getTime();
      return d >= s && d <= e;
    });
  };

  return <div>Monthly</div>;
};
