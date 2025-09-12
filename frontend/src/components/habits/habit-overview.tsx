import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { isSameDay } from "date-fns";

export interface DayData {
  date: Date;
  completionRate: number;
  isProgrammeDay: boolean;
  color: string;
}

export interface HabitOverViewProps {
  days: DayData[];
  selectedDate: Date | null;
  showDayLabels?: boolean;
  showCompletionRate?: boolean;
  onDateSelected?: (date: Date) => void;
}

export const HabitOverView = ({
  days,
  selectedDate,
  showDayLabels,
  showCompletionRate,
  onDateSelected,
}: HabitOverViewProps) => {
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
            const isSelected = selectedDay
              ? isSameDay(day.date, selectedDay)
              : false;

            return (
              <div
                key={dayIndex}
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                  day.isProgrammeDay
                    ? isSelected
                      ? "scale-110 cursor-pointer"
                      : "hover:scale-105 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (day.isProgrammeDay) {
                    setSelectedDay(day.date);
                    onDateSelected?.(day.date);
                  }
                }}
              >
                {/* Day label above */}
                {showDayLabels && (
                  <div
                    className={`text-xs font-medium text-center ${
                      isSelected ? "text-blue-600" : "text-muted-foreground"
                    }`}
                  >
                    {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                )}
                {/* Day circle */}
                <div
                  className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    day.isProgrammeDay
                      ? `${day.color} text-white`
                      : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-400"
                  } ${
                    isSelected && day.isProgrammeDay
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  }
                }`}
                >
                  {day.isProgrammeDay ? (
                    <>{day.date.getDate()}</>
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                {showCompletionRate && (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(day.completionRate * 100)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
