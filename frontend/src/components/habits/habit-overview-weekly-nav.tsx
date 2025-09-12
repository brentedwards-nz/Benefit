"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

// export interface HabitOverViewProps {
//   days: DayData[];
//   selectedDate: Date | null;
// }

// export const HabitOverView = ({ days, selectedDate }: HabitOverViewProps) => {

interface HabitOverViewWeeklyNavProps {
  selectedDate: Date;
}

function getMondayToSundayRange(selectedDate: Date): string {
  const day = selectedDate.getDay();
  const monday = new Date(selectedDate);
  const diff = selectedDate.getDate() - (day === 0 ? 6 : day - 1);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedMonday = formatter.format(monday);
  const formattedSunday = formatter.format(sunday);
  return `${formattedMonday} - ${formattedSunday}`;
}

const HabitOverViewWeeklyNav = ({
  selectedDate,
}: HabitOverViewWeeklyNavProps) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push("/dashboard/client/habits")}
        aria-label="Back to overview"
        className="p-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => alert("To do...")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold mx-4">
          {getMondayToSundayRange(selectedDate)}
        </h2>
        <Button variant="outline" size="icon" onClick={() => alert("To do...")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-10"></div> {/* Placeholder for alignment */}
    </div>
  );
};

export default HabitOverViewWeeklyNav;
