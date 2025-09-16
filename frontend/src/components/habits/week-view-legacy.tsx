import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

interface ClientHabits {
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

interface ProgrammeHabit {
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

interface DayData {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  completionRate: number; // 0-1
}

interface WeekData {
  days: DayData[];
}

interface WeekViewProps {
  selectedWeek: WeekData;
  selectedDate: Date;
  programmeHabits: ProgrammeHabit[];
  habitCompletions: ClientHabits[];
  isSelf?: boolean;
  onBack: () => void;
  onHabitToggle: (
    programmeHabitId: string,
    date: Date,
    completed: boolean
  ) => void;
}

export const WeekView = ({
  selectedWeek,
  selectedDate,
  programmeHabits,
  habitCompletions,
  isSelf = true,
  onBack,
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

  const getDayColor = (completionRate: number): string => {
    if (completionRate === 1) return "bg-green-500";
    if (completionRate === 0) return "bg-red-500";

    if (completionRate >= 0.8) return "bg-orange-400";
    if (completionRate >= 0.6) return "bg-orange-500";
    if (completionRate >= 0.4) return "bg-orange-600";
    return "bg-orange-700";
  };

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

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => {
            const topOfWeek = selectedWeek.days[0]?.date;
            const queryParams = new URLSearchParams();
            if (topOfWeek) {
              queryParams.set("date", topOfWeek.toISOString().split("T")[0]);
            }
            // Preserve client context if present via pathname query param on the parent (handled by habits page)
            // The habits page will read ?date= and anchor the grid to that week
            window.location.href = `/dashboard/client/habits${
              queryParams.toString() ? `?${queryParams.toString()}` : ""
            }`;
          }}
          className="mb-3 inline-flex items-center justify-center rounded-full w-12 h-12"
          aria-label="Back to overview"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl text-center font-bold">
          {selectedWeek.days[0]?.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {selectedWeek.days[
            selectedWeek.days.length - 1
          ]?.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </h1>
      </div>

      {/* Week day selector - 7 circles across the top */}
      <div className="mb-6 flex justify-center">
        <div className="grid grid-cols-7 gap-2 w-full max-w-2xl">
          {selectedWeek.days.map((day, dayIndex) => {
            const isSelected =
              selectedDay &&
              day.date.toDateString() === selectedDay.toDateString();
            const dateString = day.date.toISOString().split("T")[0];
            const dayCompletions = habitCompletions.filter(
              (c) => c.completionDate.split("T")[0] === dateString
            );

            // Only count habits active on this date; a habit is complete when timesDone >= requiredPerDay
            const activeHabits = programmeHabits.filter((ph) =>
              isWithinProgramme(ph, day.date)
            );
            const completedCount = activeHabits.filter((ph) => {
              const requiredPerDay = Math.max(1, ph.frequencyPerDay ?? 1);
              const rec = dayCompletions.find(
                (c) => c.programmeHabitId === ph.id
              );
              const times =
                rec?.timesDone ?? (rec?.completed ? requiredPerDay : 0);
              return times >= requiredPerDay;
            }).length;
            const completionRate =
              activeHabits.length > 0
                ? completedCount / activeHabits.length
                : 0;

            const withinProgramme = isDayWithinAnyProgramme(day.date);

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
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    withinProgramme
                      ? `${getDayColor(completionRate)} text-white`
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
                  {Math.round(completionRate * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day habits: only show for self and while programme is in progress */}
      {selectedDay && isSelf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programmeHabits.length > 0 ? (
              <div className="space-y-3">
                {programmeHabits
                  .filter((h) => {
                    const start = h.programme?.startDate
                      ? new Date(h.programme.startDate)
                      : null;
                    const end = h.programme?.endDate
                      ? new Date(h.programme.endDate)
                      : null;
                    if (!start || !end) return true; // if dates unknown, show by default
                    const today = new Date(
                      new Date().toISOString().split("T")[0]
                    );
                    const s = new Date(
                      start.toISOString().split("T")[0]
                    ).getTime();
                    const e = new Date(
                      end.toISOString().split("T")[0]
                    ).getTime();
                    const t = today.getTime();
                    return t >= s && t <= e; // programme currently in progress
                  })
                  .map((habit) => {
                    const dateString = selectedDay.toISOString().split("T")[0];
                    const completion = habitCompletions.find(
                      (c) =>
                        c.programmeHabitId === habit.id &&
                        c.completionDate.split("T")[0] === dateString
                    );
                    const timesDone = completion?.timesDone ?? 0;
                    const requiredPerDay = Math.max(
                      1,
                      habit.frequencyPerDay ?? 1
                    );
                    const isCompleted = timesDone >= requiredPerDay;

                    {
                      /* Habit card */
                    }
                    return (
                      <div
                        key={habit.id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isDisabledForEdit
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
                          isCompleted
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (isDisabledForEdit) {
                            toast.error(
                              isFutureSelectedDay
                                ? "You cannot complete habits for a future date."
                                : "You cannot edit habits more than 3 days in the past."
                            );
                            return;
                          }
                          onHabitToggle(habit.id, selectedDay, isCompleted);
                        }}
                      >
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              isCompleted ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            {habit.habit?.title || "Unknown Habit"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {habit.programme.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={isDisabledForEdit || timesDone <= 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDisabledForEdit) {
                                toast.error(
                                  isFutureSelectedDay
                                    ? "You cannot complete habits for a future date."
                                    : "You cannot edit habits more than 3 days in the past."
                                );
                                return;
                              }
                              onHabitToggle(habit.id, selectedDay, false);
                            }}
                            title="Decrease"
                          >
                            −
                          </Button>
                          <div className="text-sm tabular-nums min-w-[2.5rem] text-center">
                            {timesDone}/{requiredPerDay}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={isDisabledForEdit}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDisabledForEdit) {
                                toast.error(
                                  isFutureSelectedDay
                                    ? "You cannot complete habits for a future date."
                                    : "You cannot edit habits more than 3 days in the past."
                                );
                                return;
                              }
                              onHabitToggle(habit.id, selectedDay, true);
                            }}
                            title="Increase"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No habits assigned for this programme.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
