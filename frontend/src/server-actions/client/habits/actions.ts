"use server";
import { addDays, isSameDay } from "date-fns";
import { toBenefitDateRange, BenefitDateRange } from "@/utils/date-utils";
import { ActionResult } from "@/types/server-action-results";
import { HabitDayData } from "./types";
import prisma from "@/utils/prisma/client";
import { getDayColor } from "@/utils/general-utils";

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
  // title: string;
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
  programmeHabitId: string;

  completionDate: Date;
  completed: boolean;
  timesDone: number;
  habitFrequency?: number;
}

export async function readClientHabitsByDate(
  user_id: string,
  date: Date
): Promise<ActionResult<DailyHabit[]>> {
  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  console.log("Reading habits for user:", user_id, "on date:", date);

  try {
    const habits = await prisma.clientHabit.findMany({
      where: {
        AND: [
          { clientId: user_id },
          {
            habitDate: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lte: new Date(date.setHours(23, 59, 59, 999)),
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
            habit: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        habitDate: "asc",
      },
    });

    if (!habits) {
      return {
        success: true,
        data: [],
      };
    }

    const result: DailyHabit[] = habits.map((habit) => ({
      title: habit.programmeHabit.habit.title,
      programmeHabitId: habit.programmeHabitId,
      completionDate: habit.habitDate,
      completed: habit.completed,
      timesDone: habit.timesDone,
      habitFrequency: (() => {
        const dayOfWeek = habit.habitDate.getDay();
        switch (dayOfWeek) {
          case 0:
            return habit.programmeHabit.sunFrequency;
          case 1:
            return habit.programmeHabit.monFrequency;
          case 2:
            return habit.programmeHabit.tueFrequency;
          case 3:
            return habit.programmeHabit.wedFrequency;
          case 4:
            return habit.programmeHabit.thuFrequency;
          case 5:
            return habit.programmeHabit.friFrequency;
          case 6:
            return habit.programmeHabit.satFrequency;
          default:
            return 0;
        }
      })(),
    }));

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
