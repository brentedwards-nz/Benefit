"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { WeekView } from "@/components/habits/week-view";
import { toast } from "sonner";
import { HabitOverView, DayData } from "./habit-overview";
import HabitOverViewWeeklyNav from "./habit-overview-weekly-nav";
import HabitOverViewDaily from "./habit-overview-daily";
import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import { addDays } from "date-fns";

// Get the start of the week (Monday) for a given date
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const HabitOverViewWeekly = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startOfWeek, setStartOfWeek] = useState(new Date());
  const [endOfWeek, setEndOfWeek] = useState(new Date());
  const [dayData, setDayData] = useState<DayData[]>([]);

  // Get client ID from search params or fall back to current user
  const clientId = searchParams.get("clientId") || session?.user?.id;
  const isSelf =
    !searchParams.get("clientId") ||
    searchParams.get("clientId") === session?.user?.id;

  // Get date from search params if provided
  const dateParam = searchParams.get("date");

  // Update currentDate when dateParam changes
  useEffect(() => {
    if (dateParam) {
      const newDate = new Date(dateParam);
      setCurrentDate(newDate);
      setStartOfWeek(getStartOfWeek(newDate));
      setEndOfWeek(addDays(getStartOfWeek(newDate), 7));
    }
  }, [dateParam]);

  useEffect(() => {
    if (!clientId) {
      return;
      setDayData([]);
    }

    const fetchData = async () => {
      const result = await readClientHabitsByDateRange(
        clientId,
        startOfWeek,
        endOfWeek
      );

      if (!result.success) {
        toast.error("Failed to fetch habit data");
        setDayData([]);
        return;
      }

      setDayData(result.data.HabitDayData);
    };

    fetchData();
  }, [startOfWeek, clientId]);

  useEffect(() => {
    if (!clientId) {
      return;
      setDayData([]);
    }

    const fetchData = async () => {
      const result = await readClientHabitsByDateRange(
        clientId,
        startOfWeek,
        endOfWeek
      );

      if (!result.success) {
        toast.error("Failed to fetch daily habit data");
        setDayData([]);
        return;
      }

      setDayData(result.data.HabitDayData);
    };

    fetchData();
  }, [currentDate, clientId]);

  return (
    <div>
      <div className="w-full">
        <HabitOverViewWeeklyNav selectedDate={currentDate} />
      </div>
      <div className="w-full">
        <HabitOverView days={dayData} selectedDate={currentDate} />
      </div>
      <div className="w-full">
        <HabitOverViewDaily selectedDate={currentDate} clientId={clientId} />
      </div>
    </div>
  );
};

export default HabitOverViewWeekly;
