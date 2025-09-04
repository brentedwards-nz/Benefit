import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import tr from "zod/v4/locales/tr.cjs";
import { getDayColor } from "@/utils/general-utils";

export interface ClientHabits {
  id: string;
  completionDate: string;
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

export interface HabitOverViewProps {
  days: DayData[];
  selectedDate: Date | null;
}

export const HabitOverView = ({ days, selectedDate }: HabitOverViewProps) => {
  // Use the selectedDate prop as the initial selected day
  const [selectedDay, setSelectedDay] = useState<Date | null>(selectedDate);

  // Update selected day when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedDay(selectedDate);
    }
  }, [selectedDate]);

  return (
    <div>
      {/* Week day selector - 7 circles across the top */}
      <div className="mb-6 flex justify-center">
        <div className="grid grid-cols-7 gap-2 w-full max-w-xl">
          {days.map((day, dayIndex) => {
            const isSelected =
              selectedDay &&
              day.date.toDateString() === selectedDay.toDateString();

            const withinProgramme = true; // For now, assume all days are within the programme

            return (
              <div
                key={dayIndex}
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                  withinProgramme
                    ? isSelected
                      ? "scale-110 cursor-pointer"
                      : "hover:scale-105 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (withinProgramme) {
                    setSelectedDay(day.date);
                  }
                }}
              >
                {/* Day label above */}
                <div
                  className={`text-xs font-medium text-center ${
                    isSelected ? "text-blue-600" : "text-muted-foreground"
                  }`}
                >
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>

                {/* Day circle */}
                <div
                  className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    withinProgramme
                      ? `${getDayColor(day.completionRate)} text-white`
                      : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-400"
                  } ${
                    isSelected && withinProgramme
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  }
                                    }`}
                >
                  {withinProgramme ? (
                    <>{day.date.getDate()}</>
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                {/* Completion percentage */}
                <div className="text-xs text-muted-foreground">
                  {Math.round(day.completionRate * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
