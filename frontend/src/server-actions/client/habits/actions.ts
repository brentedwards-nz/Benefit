"use server";
import { addDays, differenceInCalendarDays } from "date-fns";
import { format } from "date-fns-tz";
import { ActionResult } from "@/types/server-action-results";
import { HabitDayData } from "./types";
import prisma from "@/utils/prisma/client";
import { getDayColor } from "@/utils/general-utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { normalizeDate, normalizeDateString } from "@/utils/date-utils";

interface QueryParameters {
  function_name: string;
  user_id: string;
  startDate: string;
  endDate: string;
}

export interface HabitIntermediateData {
  QueryParameters: QueryParameters;
  Programmes: Programme[];
  ClientHabits: ClientHabit[];
  HabitDayData: HabitDayData[];
}

export async function readClientHabitsByDateRange(
  user_id: string,
  startDate: string,
  endDate: string,
  timezone: string = "UTC"
): Promise<ActionResult<HabitIntermediateData>> {
  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  const queryParameters: QueryParameters = {
    function_name: "readClientHabitsByDateRange",
    user_id,
    startDate,
    endDate,
  };

  try {
    const programmes = await getProgrammeHabitsbyClientAndDateRange(
      user_id,
      startDate,
      endDate
    );

    if (!programmes.success) {
      return {
        success: false,
        message: programmes.message || "Failed to fetch programmes",
        code: programmes.code,
        details: programmes.details,
      };
    }

    const clientHabits = await getClientHabitsByDateRange(
      user_id,
      startDate,
      endDate
    );
    if (!clientHabits.success) {
      return {
        success: false,
        message: clientHabits.message || "Failed to fetch client habits",
        code: clientHabits.code,
        details: clientHabits.details,
      };
    }

    let habitDayData = calculateHabitDayData(
      startDate,
      endDate,
      programmes.data,
      clientHabits.data,
      timezone
    );

    const clientHabitsResult: HabitIntermediateData = {
      QueryParameters: queryParameters,
      Programmes: programmes.data,
      ClientHabits: clientHabits.data,
      HabitDayData: habitDayData,
    };

    return {
      success: true,
      data: clientHabitsResult,
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

const areDatesOnSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

function calculateHabitDayData(
  startDate: string,
  endDate: string,
  programmes: Programme[],
  clientHabits: ClientHabit[],
  timezone: string
): HabitDayData[] {
  let result: HabitDayData[] = [];
  const duration = differenceInCalendarDays(endDate, startDate) + 1;

  for (let i = 0; i < duration; i++) {
    const currentDate = normalizeDate(addDays(new Date(startDate), i));

    // Calculate how many habits are scheduled for this day
    const dayOfWeek = parseInt(format(currentDate, "e", { timeZone: timezone })) - 1;
    let habitCount = 0;

    let isProgrammeDay = false;

    programmes.forEach((programme) => {
      if (
        currentDate >= programme.startDate &&
        currentDate <= programme.endDate
      ) {
        isProgrammeDay = true;
        programme.habits.forEach((habit) => {
          switch (dayOfWeek) {
            case 0:
              if (habit.sunFrequency > 0) habitCount++;
              break;
            case 1:
              if (habit.monFrequency > 0) habitCount++;
              break;
            case 2:
              if (habit.tueFrequency > 0) habitCount++;
              break;
            case 3:
              if (habit.wedFrequency > 0) habitCount++;
              break;
            case 4:
              if (habit.thuFrequency > 0) habitCount++;
              break;
            case 5:
              if (habit.friFrequency > 0) habitCount++;
              break;
            case 6:
              if (habit.satFrequency > 0) habitCount++;
              break;
          }
        });
      }
    });

    // Calculate how many habits were completed on this day
    let completedHabitCount = 0;
    clientHabits.forEach((clientHabit) => {
      if (
        isSameDay(clientHabit.habitDate, currentDate) &&
        clientHabit.timesDone >= clientHabit.habitFrequency
      ) {
        completedHabitCount++;
      }
    });

    const completionRate =
      habitCount === 0 ? 0 : completedHabitCount / habitCount;

    result.push({
      date: currentDate,
      completionRate: completionRate,
      isCurrentMonth: false,
      isProgrammeDay: isProgrammeDay,
      color: getDayColor(completionRate),
    });
  }

  return result;
}

interface Habit {
  id: string;
  title: string;
  // notes: string | null;
  monFrequency: number;
  tueFrequency: number;
  wedFrequency: number;
  thuFrequency: number;
  friFrequency: number;
  satFrequency: number;
  sunFrequency: number;
}

interface Programme {
  id: string;
  name: string;
  humanReadableId: string;
  startDate: Date;
  endDate: Date;
  habits: Habit[];
}

export interface HabitIntermediateData {
  Programmes: Programme[];
}

async function getProgrammeHabitsbyClientAndDateRange(
  user_id: string,
  begin: string,
  finish: string | null
): Promise<ActionResult<Programme[]>> {
  try {
    const normalizedBegin = normalizeDateString(begin);

    const normalizedFinish = finish ? normalizeDateString(finish) : null;
    if (normalizedFinish) {
      normalizedFinish.setHours(0, 0, 0, 0);
    }

    const programmeWhereClause: any = {};
    if (normalizedFinish === null) {
      programmeWhereClause.AND = [
        { startDate: { lte: normalizedBegin } },
        { endDate: { gte: normalizedBegin } },
      ];
    } else {
      programmeWhereClause.AND = [
        { startDate: { lte: normalizedFinish } },
        { endDate: { gte: normalizedBegin } },
      ];
    }

    const client = await prisma.client.findUnique({
      where: {
        id: user_id,
      },
      select: {
        firstName: true,
        lastName: true,
        programmeEnrolments: {
          where: {
            programme: programmeWhereClause,
          },
          select: {
            programme: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                humanReadableId: true,
                programmeHabits: {
                  select: {
                    id: true,
                    habit: {
                      select: {
                        title: true,
                      },
                    },
                    monFrequency: true,
                    tueFrequency: true,
                    wedFrequency: true,
                    thuFrequency: true,
                    friFrequency: true,
                    satFrequency: true,
                    sunFrequency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!client) {
      return {
        success: false,
        message: `Client with ID ${user_id} not found`,
        code: "CLIENT_NOT_FOUND",
      };
    }

    const programmes: Programme[] = client.programmeEnrolments.map((value) => ({
      id: value.programme.id,
      name: value.programme.name,
      humanReadableId: value.programme.humanReadableId,
      startDate: value.programme.startDate,
      endDate: value.programme.endDate ?? new Date(),
      habits: value.programme.programmeHabits.map((ph) => ({
        id: ph.id,
        title: ph.habit.title,
        monFrequency: ph.monFrequency,
        tueFrequency: ph.tueFrequency,
        wedFrequency: ph.wedFrequency,
        thuFrequency: ph.thuFrequency,
        friFrequency: ph.friFrequency,
        satFrequency: ph.satFrequency,
        sunFrequency: ph.sunFrequency,
      })),
    }));

    return {
      success: true,
      data: programmes,
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

interface ClientHabit {
  programmeHabitId: string;
  habitDate: Date;
  completed: boolean;
  timesDone: number;
  habitFrequency: number;
}

async function getClientHabitsByDateRange(
  clientId: string,
  beginDate: string,
  finishDate: string
): Promise<ActionResult<ClientHabit[]>> {
  try {
    const normalizedBegin = normalizeDateString(beginDate);
    normalizedBegin.setHours(0, 0, 0, 0);

    const normalizedFinish = normalizeDateString(finishDate);
    normalizedFinish.setHours(0, 0, 0, 0);

    const habits = await prisma.clientHabit.findMany({
      where: {
        AND: [
          { clientId: clientId },
          {
            habitDate: {
              gte: normalizedBegin,
              lte: normalizedFinish,
            },
          },
        ],
      },
      select: {
        programmeHabitId: true,
        habitDate: true,
        completed: true,
        timesDone: true,
        programmeHabit: {
          select: {
            monFrequency: true,
            tueFrequency: true,
            wedFrequency: true,
            thuFrequency: true,
            friFrequency: true,
            satFrequency: true,
            sunFrequency: true,
          },
        },
      },
      orderBy: {
        habitDate: "asc",
      },
    });

    if (!habits) {
      return {
        success: false,
        message: `No habits found for client with ID ${clientId} in the specified date range`,
        code: "HABITS_NOT_FOUND",
      };
    }

    const result: ClientHabit[] = habits.map((habit) => {
      const dayOfWeek = habit.habitDate.getDay(); // 0 for Sunday, 1 for Monday, ...
      const frequencies = [
        habit.programmeHabit.sunFrequency,
        habit.programmeHabit.monFrequency,
        habit.programmeHabit.tueFrequency,
        habit.programmeHabit.wedFrequency,
        habit.programmeHabit.thuFrequency,
        habit.programmeHabit.friFrequency,
        habit.programmeHabit.satFrequency,
      ];
      const habitFrequency = frequencies[dayOfWeek];

      return {
        programmeHabitId: habit.programmeHabitId,
        habitDate: habit.habitDate,
        completed: habit.completed,
        timesDone: habit.timesDone,
        habitFrequency: habitFrequency,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export interface DailyHabit {
  title: string;
  clientHabitId?: string;
  programmeHabitId: string;
  habitDate: string;
  completed: boolean;
  timesDone: number;
  habitFrequency?: number;
}

export async function readClientHabitsByDate(
  user_id: string, // Parameter restored as per user feedback
  date: string
): Promise<ActionResult<DailyHabit[]>> {
  // Security check: Ensure the caller is logged in.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized: You must be logged in." };
  }
  // Note: A more robust authorization check would verify if the logged-in user
  // has permission to view the habits for the requested `user_id`.
  // This is omitted for now as per the immediate requirement.

  try {
    // 1. Get the scheduled habits for the day for the specified user_id
    const programmesResult = await getProgrammeHabitsbyClientAndDateRange(
      user_id,
      date,
      null
    );

    if (!programmesResult.success) {
      return programmesResult;
    }

    if (programmesResult.data.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Get existing ClientHabit records for that day for the specified user_id
    const selectedDate = normalizeDateString(date);
    const existingClientHabits = await prisma.clientHabit.findMany({
      where: {
        clientId: user_id,
        habitDate: selectedDate,
      },
    });

    console.log(JSON.stringify(existingClientHabits, null, 2));

    // 3. Create a lookup map for easy access
    const clientHabitMap = new Map(
      existingClientHabits.map((ch) => [ch.programmeHabitId, ch])
    );

    let result: DailyHabit[] = [];
    for (const programme of programmesResult.data) {
      for (const habit of programme.habits) {
        const existingRecord = clientHabitMap.get(habit.id);

        const dayOfWeek = selectedDate.getDay();
        const habitFrequency = [
          habit.sunFrequency,
          habit.monFrequency,
          habit.tueFrequency,
          habit.wedFrequency,
          habit.thuFrequency,
          habit.friFrequency,
          habit.satFrequency,
        ][dayOfWeek];

        if (habitFrequency > 0) {
          result.push({
            title: habit.title,
            programmeHabitId: habit.id,
            habitDate: date,
            clientHabitId: existingRecord?.id,
            completed: existingRecord?.completed ?? false,
            timesDone: existingRecord?.timesDone ?? 0,
            habitFrequency: habitFrequency,
          });
        }
      }
    }

    console.log("*** readClientHabitsByDate result:");
    console.log(JSON.stringify(result, null, 2));

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error("Error in readClientHabitsByDate:", err);
    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

import { ClientHabit as PrismaClientHabit } from "@prisma/client";
import en from "zod/v4/locales/en.cjs";
import is from "zod/v4/locales/is.cjs";

// This type is for data coming from the client
type UpsertHabitData = {
  programmeHabitId: string;
  habitDate: string;
  timesDone: number;
  completed: boolean;
};

export async function upsertClientHabit(
  data: UpsertHabitData
): Promise<ActionResult<PrismaClientHabit>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }
  const authId = session.user.id;

  try {
    const client = await prisma.client.findUnique({
      where: { authId },
      select: { id: true },
    });

    if (!client) {
      return { success: false, message: "Client not found." };
    }
    const clientId = client.id;
    const { programmeHabitId, habitDate, timesDone, completed } = data;

    // The unique constraint is on (programmeHabitId, clientId, habitDate)
    // So we use that to find the record to update or create.
    const selectedDate = new Date(habitDate);
    selectedDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day UTC

    const result = await prisma.clientHabit.upsert({
      where: {
        programmeHabitId_clientId_habitDate: {
          programmeHabitId,
          clientId,
          habitDate: selectedDate,
        },
      },
      update: {
        timesDone,
        completed,
      },
      create: {
        programmeHabitId,
        clientId,
        habitDate: selectedDate,
        timesDone,
        completed,
      },
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error upserting client habit:", error);
    return { success: false, message: "Failed to update habit." };
  }
}
function isSameDay(habitDate: Date, currentDate: Date): boolean {
  return areDatesOnSameDay(habitDate, currentDate);
}
