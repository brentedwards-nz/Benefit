// app/habits/HabitClientWrapper.tsx
"use client";

import { useState } from "react";
import { HabitOverView, DayData } from "@/components/habits/habit-overview";

interface HabitClientWrapperProps {
  daysData: DayData[];
}

export default function HabitClientWrapper({
  daysData,
}: HabitClientWrapperProps) {
  const [habitOverViewProps, setHabitOverViewProps] = useState({
    days: daysData,
    selectedDate: new Date(),
  });

  return (
    <div className="w-full">
      <HabitOverView
        days={habitOverViewProps.days}
        selectedDate={habitOverViewProps.selectedDate}
      />
      {/* You can add more interactive UI here that needs client-side state */}
    </div>
  );
}
