"use server";
import { addDays, isSameDay } from "date-fns";
import { toBenefitDateRange, BenefitDateRange } from "@/utils/date-utils";
import { ActionResult } from "@/types/server-action-results";
import { HabitDayData } from "./types";
import prisma from "@/utils/prisma/client";
import { getDayColor } from "@/utils/general-utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface QueryParameters {
  function_name: string;
  user_id: string;
  startDate: Date;
  endDate: Date;
  dateRange: BenefitDateRange;
}

export interface HabitIntermediateData {
  QueryParameters: QueryParameters;
  Programmes: Programme[];
  ClientHabits: ClientHabit[];
  HabitDayData: HabitDayData[];
}

export async function readClientHabitsByDateRange(
  user_id: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<HabitIntermediateData>> {
  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  const dateRange = toBenefitDateRange(startDate, endDate);
  if (!dateRange) {
    console.error("Invalid date range provided to getClientHabitsByDateRange.");
    return {
      success: false,
      message: `Invalid date range provided`,
    };
  }

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
      dateRange,
      programmes.data,
      clientHabits.data
    );

    const queryParameters: QueryParameters = {
      function_name: "readClientHabitsByDateRange",
      user_id,
      startDate: startDate,
      endDate: endDate,
      dateRange: dateRange,
    };

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
      message: `An unexpected server error occurred: ${err.message || "Unknown error"}`,
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
  range: BenefitDateRange,
  programmes: Programme[],
  clientHabits: ClientHabit[]
): HabitDayData[] {
  let result: HabitDayData[] = [];

  for (let i = 0; i < range.duration; i++) {
    const currentDate = addDays(new Date(range.start), i);
    currentDate.setHours(0, 0, 0, 0);

    // Calculate how many habits are scheduled for this day
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
    let habitCount = 0;

    let isProgrammeDay = false;

    programmes.forEach((programme) => {
      // Check if the current date is within the programme's date range
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
    //console.log("Client habit:", currentDate);
    clientHabits.forEach((clientHabit) => {
      //console.log("Client habit:", clientHabit.completionDate, currentDate);
      if (
        areDatesOnSameDay(clientHabit.completionDate, currentDate) &&
        clientHabit.timesDone > 0
      ) {
        completedHabitCount++;
      }
    });
    console.log("\n");

    const completionRate =
      habitCount === 0 ? 0 : completedHabitCount / habitCount;

    result.push({
      date: currentDate,
      dayNumber: currentDate.getDate(),
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
  begin: Date,
  finish: Date
): Promise<ActionResult<Programme[]>> {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: user_id,
      },
      select: {
        firstName: true,
        lastName: true,
        programmeEnrolments: {
          where: {
            programme: {
              AND: [
                { startDate: { lte: finish } },
                { endDate: { gte: begin } },
              ],
            },
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

    const programmesResult = client.programmeEnrolments;

    const programmes: Programme[] = programmesResult.map((value) => ({
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
      message: `An unexpected server error occurred: ${err.message || "Unknown error"}`,
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
  completionDate: Date;
  completed: boolean;
  timesDone: number;
}

async function getClientHabitsByDateRange(
  clientId: string,
  beginDate: Date,
  finishDate: Date
): Promise<ActionResult<ClientHabit[]>> {
  try {
    const habits = await prisma.clientHabit.findMany({
      where: {
        AND: [
          { clientId: clientId },
          {
            habitDate: {
              gte: beginDate,
              lte: finishDate,
            },
          },
        ],
      },
      select: {
        programmeHabitId: true,
        habitDate: true,
        completed: true,
        timesDone: true,
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

    const result: ClientHabit[] = habits.map((habit) => ({
      programmeHabitId: habit.programmeHabitId,
      completionDate: habit.habitDate,
      completed: habit.completed,
      timesDone: habit.timesDone,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `An unexpected server error occurred: ${err.message || "Unknown error"}`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

// model ClientHabits {
//   id               String   @id @default(cuid())
//   programmeHabitId String
//   clientId         String
//   completionDate   DateTime @db.Date
//   completed        Boolean  @default(false)
//   timesDone        Int      @default(0)
//   notes            String?
//   createdAt        DateTime @default(now()) @db.Timestamp(6)
//   updatedAt        DateTime @default(now()) @db.Timestamp(6)

//   // Relationships
//   programmeHabit ProgrammeHabit @relation(fields: [programmeHabitId], references: [id], onDelete: Cascade)
//   client         Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)

//   @@unique([programmeHabitId, clientId, completionDate]) // One completion per habit per client per day
// }

export interface DailyHabit {
  title: string;
  clientHabitId?: string;
  programmeHabitId: string;
  habitDate: Date;
  completed: boolean;
  timesDone: number;
  habitFrequency?: number;
}

export async function readClientHabitsByDate(
  user_id: string, // Parameter restored as per user feedback
  date: Date
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
      date
    );

    if (!programmesResult.success) {
      return programmesResult;
    }
    if (programmesResult.data.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Get existing ClientHabit records for that day for the specified user_id
    const existingClientHabits = await prisma.clientHabit.findMany({
      where: {
        clientId: user_id,
        habitDate: date,
      },
    });

    // 3. Create a lookup map for easy access
    const clientHabitMap = new Map(
      existingClientHabits.map((ch) => [ch.programmeHabitId, ch])
    );

    let result: DailyHabit[] = [];
    for (const programme of programmesResult.data) {
      for (const habit of programme.habits) {
        const existingRecord = clientHabitMap.get(habit.id);

        const dayOfWeek = date.getDay();
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

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error("Error in readClientHabitsByDate:", err);
    return {
      success: false,
      message: `An unexpected server error occurred: ${err.message || "Unknown error"}`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

import { ClientHabit as PrismaClientHabit } from "@prisma/client";

// This type is for data coming from the client
type UpsertHabitData = {
  programmeHabitId: string;
  habitDate: Date;
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
    const result = await prisma.clientHabit.upsert({
      where: {
        programmeHabitId_clientId_habitDate: {
          programmeHabitId,
          clientId,
          habitDate,
        },
      },
      update: {
        timesDone,
        completed,
      },
      create: {
        programmeHabitId,
        clientId,
        habitDate,
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