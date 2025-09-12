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
import { readClient } from "@/server-actions/client/actions";

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startOfWeek, setStartOfWeek] = useState(new Date());
  const [endOfWeek, setEndOfWeek] = useState(new Date());
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [userId, setUserId] = useState<string>("");

  const sessionUser = session?.user.id;
  const clientId = searchParams.get("clientId");
  const dateParam = searchParams.get("date");

  useEffect(() => {
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
        setSelectedDate(parsedDate);
      }
    }
  }, [dateParam]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session || (!session.user.id && !clientId)) {
        setUserId("");
        return;
      }

      const result = await readClient(session?.user.id, clientId ?? "");

      if (!result.success) {
        toast.error("Failed to fetch client:" + result.message || "");
        setUserId("");
        return;
      }

      setUserId(result.data.id);
    };

    fetchData();
  }, [session]);

  useEffect(() => {
    if (!userId) {
      setDayData([]);
      return;
    }

    if (!dateParam) {
      setDayData([]);
      return;
    }

    const fetchData = async () => {
      const result = await readClientHabitsByDateRange(
        userId,
        getStartOfWeek(currentDate),
        addDays(getStartOfWeek(currentDate), 7)
      );

      if (!result.success) {
        toast.error("Failed to fetch daily habit data:" + result.message || "");
        setDayData([]);
        return;
      }

      setDayData(result.data.HabitDayData);
    };

    fetchData();
  }, [userId, currentDate]);

  return (
    <div>
      <div className="w-full">
        <HabitOverViewWeeklyNav selectedDate={currentDate} />
      </div>
      <div className="w-full">
        <HabitOverView
          days={dayData}
          selectedDate={currentDate}
          onDateSelected={(clickedDate) => {
            setSelectedDate(clickedDate);
          }}
        />
      </div>
      <div className="w-full">
        <HabitOverViewDaily selectedDate={selectedDate} clientId={userId} />
      </div>
    </div>
  );
};

export default HabitOverViewWeekly;
