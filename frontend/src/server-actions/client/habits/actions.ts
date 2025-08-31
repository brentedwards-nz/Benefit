"use server";
import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { HabitDayData } from "./types";
import { z } from "zod";

interface QueryParameters {
  user_id: string;
  startDate: Date;
  endDate: Date;
}

export interface HabitintermediateData {
  QueryParameters: QueryParameters;
  HabitDayData: HabitDayData[];
  Programmes: Programme[];
}

export async function readClientHabitsByDateRange(
  user_id: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<HabitintermediateData>> {
  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  const beginDate = startDate;
  beginDate.setHours(0, 0, 0, 0);
  const finishDate = endDate;
  finishDate.setHours(23, 59, 59, 999);

  try {
    const programmeHabits = await prisma.programmeHabit.findMany({
      where: {
        programme: {
          enrolments: {
            some: {
              clientId: user_id,
            },
          },
        },
        current: true,
      },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            humanReadableId: true,
            startDate: true,
            endDate: true,
          },
        },
        habit: {
          select: {
            id: true,
            title: true,
            notes: true,
          },
        },
        _count: { select: { completions: true } },
      },
      orderBy: [{ programme: { name: "asc" } }, { habit: { title: "asc" } }],
    });

    const programmes = await clientProgrammeEnrolmentsbyDateRange(
      user_id,
      beginDate,
      finishDate
    );

    if (!programmes.success) {
      return {
        success: false,
        message: programmes.message || "Failed to fetch programmes",
        code: programmes.code,
        details: programmes.details,
      };
    }

    const queryParameters: QueryParameters = {
      user_id,
      startDate: beginDate,
      endDate: finishDate,
    };

    const clientHabitsResult: HabitintermediateData = {
      QueryParameters: queryParameters,
      HabitDayData: [
        {
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          habitCount: 3,
          completedCount: 2,
          isLocked: false,
        },
      ],
      Programmes: programmes.data,
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

interface Programme {
  id: string;
  name: string;
  humanReadableId: string;
  startDate: Date;
  endDate: Date;
}
export interface HabitIntermediateData {
  Programmes: Programme[];
}

async function clientProgrammeEnrolmentsbyDateRange(
  user_id: string,
  beginDate: Date,
  finishDate: Date
): Promise<ActionResult<Programme[]>> {
  try {
    const programmesResult = await prisma.programmeEnrolment.findMany({
      where: {
        programme: {
          enrolments: {
            some: {
              clientId: user_id,
            },
          },
          OR: [
            {
              // beginDate is in programme's range
              AND: [
                { startDate: { lte: beginDate } },
                {
                  OR: [
                    { endDate: { gte: beginDate } },
                    { endDate: { equals: null } },
                  ],
                },
              ],
            },
            {
              // finishDate is in programme's range
              AND: [
                { startDate: { lte: finishDate } },
                {
                  OR: [
                    { endDate: { gte: finishDate } },
                    { endDate: { equals: null } },
                  ],
                },
              ],
            },
          ],
        },
      },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            humanReadableId: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const programmes: Programme[] = programmesResult.map((value) => ({
      id: value.programme.id,
      name: value.programme.name,
      humanReadableId: value.programme.humanReadableId,
      startDate: value.programme.startDate,
      endDate: value.programme.endDate ?? new Date(),
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
