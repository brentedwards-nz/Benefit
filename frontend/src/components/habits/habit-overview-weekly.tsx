"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HabitOverView, DayData } from "./habit-overview";
import HabitOverViewWeeklyNav from "./habit-overview-weekly-nav";
import HabitOverViewDaily from "./habit-overview-daily";
import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import { addDays } from "date-fns";
import { readClient } from "@/server-actions/client/actions";
import { useQuery } from "@tanstack/react-query";
import { getStartOfWeek } from "@/utils/date-utils";
import { Session } from "next-auth";

// External function to fetch userId
const fetchUserId = async (
  session: Session | null,
  clientIdParam: string | null
) => {
  if (!session || (!session.user.id && !clientIdParam)) {
    return "";
  }
  const result = await readClient(session?.user.id, clientIdParam ?? "");
  if (!result.success) {
    toast.error("Failed to fetch client:" + result.message || "");
    return "";
  }
  return result.data.id;
};

// External function to fetch HabitDayData
const fetchHabitDayData = async (userId: string, currentDate: Date) => {
  if (!userId) {
    return [];
  }

  const start = getStartOfWeek(currentDate).toISOString().split("T")[0];
  const end = addDays(getStartOfWeek(currentDate), 6)
    .toISOString()
    .split("T")[0];
  const result = await readClientHabitsByDateRange(userId, start, end);

  if (!result.success) {
    toast.error("Failed to fetch daily habit data:" + result.message || "");
    return [];
  }
  return result.data.HabitDayData;
};

const HabitOverViewWeekly = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const clientIdParam = searchParams.get("clientId");
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

  const { data: userId, isLoading: isLoadingUserId } = useQuery<string>({
    queryKey: ["userId", session?.user?.id, clientIdParam],
    queryFn: () => fetchUserId(session, clientIdParam),
    enabled: !!session && (!!session.user.id || !!clientIdParam),
  });

  const {
    data: dayData,
    isLoading: isLoadingDayData,
    refetch: refetchDayData,
  } = useQuery<DayData[]>({
    queryKey: ["dayData", userId, currentDate],
    queryFn: () => fetchHabitDayData(userId || "", currentDate),
    enabled: !!userId && !!dateParam,
  });

  const goToPreviousWeek = () => {
    const newDate = addDays(currentDate, -7);
    setCurrentDate(newDate);
    setSelectedDate(getStartOfWeek(newDate));
  };

  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    setCurrentDate(newDate);
    setSelectedDate(getStartOfWeek(newDate));
  };

  if (isLoadingUserId || isLoadingDayData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full">
        <HabitOverViewWeeklyNav
          selectedDate={currentDate}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
        />
      </div>
      {/* <div>
        <pre>{JSON.stringify(dayData, null, 2)}</pre>
      </div> */}
      <div className="w-full">
        <HabitOverView
          days={dayData || []}
          selectedDate={currentDate}
          showCompletionRate={true}
          showDayLabels={true}
          onDateSelected={(clickedDate) => {
            setSelectedDate(clickedDate);
          }}
        />
      </div>
      <div className="w-full">
        <HabitOverViewDaily
          selectedDate={selectedDate}
          clientId={userId || ""}
          onHabitUpdated={refetchDayData}
        />
      </div>
    </div>
  );
};

export default HabitOverViewWeekly;
