"use client";

import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";
import HabitOverViewWeekly from "@/components/habits/habit-overview-weekly";

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
      <HabitOverViewWeekly />
    </Suspense>
  );
};

export default WeeklyHabitsPage;
