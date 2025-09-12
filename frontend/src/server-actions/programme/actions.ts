"use server";

import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  Programme,
  ProgrammeCreateInput,
  ProgrammeUpdateInput,
} from "./types";
import { z } from "zod";

export type ClientSearchResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};


// Programme Server Actions
export async function readProgrammes(): Promise<ActionResult<Programme[]>> {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: {
        name: "asc",
      },
    });

    if (!programmes || programmes.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Transform the data to match our Programme type
    const programmeList: Programme[] = programmes.map((programme) => ({
      id: programme.id,
      humanReadableId: programme.humanReadableId,
      name: programme.name,
      startDate: programme.startDate,
      endDate: programme.endDate,
      maxClients: programme.maxClients,
      sessionsDescription: programme.sessionsDescription as any,
      programmeCost: programme.programmeCost.toNumber(),
      notes: programme.notes,
      adhocData: programme.adhocData as any,
      createdAt: programme.createdAt,
      updatedAt: programme.updatedAt,
    }));

    return {
      success: true,
      data: programmeList,
    };
  } catch (err: any) {
    console.error("Error reading programmes:", err);

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

export async function readProgrammeById(
  id: string
): Promise<ActionResult<Programme>> {
  try {
    const programme = await prisma.programme.findUnique({
      where: { id },
    });

    if (!programme) {
      return {
        success: false,
        message: "Programme not found.",
        code: "PROGRAMME_NOT_FOUND",
      };
    }

    const programmeData: Programme = {
      id: programme.id,
      humanReadableId: programme.humanReadableId,
      name: programme.name,
      startDate: programme.startDate,
      endDate: programme.endDate,
      maxClients: programme.maxClients,
      sessionsDescription: programme.sessionsDescription as any,
      programmeCost: programme.programmeCost.toNumber(),
      notes: programme.notes,
      adhocData: programme.adhocData as any,
      createdAt: programme.createdAt,
      updatedAt: programme.updatedAt,
    };

    return {
      success: true,
      data: programmeData,
    };
  } catch (err: any) {
    console.error("Error reading programme by ID:", err);

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

export async function createProgramme(
  data: ProgrammeCreateInput
): Promise<ActionResult<Programme>> {
  try {
    const programme = await prisma.programme.create({
      data: {
        humanReadableId: data.humanReadableId,
        name: data.name,
        startDate: data.startDate,
        endDate: (data as any).endDate || undefined,
        maxClients: data.maxClients,
        sessionsDescription: data.sessionsDescription || undefined,
        programmeCost: new Prisma.Decimal(data.programmeCost),
        notes: data.notes || undefined,
        adhocData: data.adhocData || undefined,
      },
    });

    const programmeData: Programme = {
      id: programme.id,
      humanReadableId: programme.humanReadableId,
      name: programme.name,
      startDate: programme.startDate,
      endDate: programme.endDate,
      maxClients: programme.maxClients,
      sessionsDescription: programme.sessionsDescription as any,
      programmeCost: programme.programmeCost.toNumber(),
      notes: programme.notes,
      adhocData: programme.adhocData as any,
      createdAt: programme.createdAt,
      updatedAt: programme.updatedAt,
    };

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: programmeData,
    };
  } catch (err: any) {
    console.error("Error creating programme:", err);

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

export async function updateProgramme(
  id: string,
  data: ProgrammeUpdateInput
): Promise<ActionResult<Programme>> {
  try {
    // Filter out undefined values to avoid Prisma errors
    const updateData: any = {};

    if (data.humanReadableId !== undefined)
      updateData.humanReadableId = data.humanReadableId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.maxClients !== undefined) updateData.maxClients = data.maxClients;
    if (data.sessionsDescription !== undefined)
      updateData.sessionsDescription = data.sessionsDescription;
    if (data.programmeCost !== undefined)
      updateData.programmeCost = new Prisma.Decimal(data.programmeCost);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.adhocData !== undefined) updateData.adhocData = data.adhocData;

    const programme = await prisma.programme.update({
      where: { id },
      data: updateData,
    });

    const programmeData: Programme = {
      id: programme.id,
      humanReadableId: programme.humanReadableId,
      name: programme.name,
      startDate: programme.startDate,
      endDate: programme.endDate,
      maxClients: programme.maxClients,
      sessionsDescription: programme.sessionsDescription as any,
      programmeCost: programme.programmeCost.toNumber(),
      notes: programme.notes,
      adhocData: programme.adhocData as any,
      createdAt: programme.createdAt,
      updatedAt: programme.updatedAt,
    };

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: programmeData,
    };
  } catch (err: any) {
    console.error("Error updating programme:", err);

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

export async function deleteProgramme(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.programme.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: undefined,
    };
  } catch (err: any) {
    console.error("Error deleting programme:", err);

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

export async function duplicateProgramme(
  id: string
): Promise<ActionResult<Programme>> {
  try {
    const originalProgramme = await prisma.programme.findUnique({
      where: { id },
    });

    if (!originalProgramme) {
      return {
        success: false,
        message: "Original programme not found.",
        code: "PROGRAMME_NOT_FOUND",
      };
    }

    // Create a new programme with copied data
    const newProgramme = await prisma.programme.create({
      data: {
        humanReadableId: `${originalProgramme.humanReadableId}_copy`,
        name: `${originalProgramme.name} (Copy)`,
        startDate: new Date(),
        maxClients: originalProgramme.maxClients,
        sessionsDescription: originalProgramme.sessionsDescription || undefined,
        programmeCost: originalProgramme.programmeCost,
        notes: originalProgramme.notes
          ? `${originalProgramme.notes} (Copied)`
          : "Copied programme",
        adhocData: originalProgramme.adhocData || undefined,
      },
    });

    const programmeData: Programme = {
      id: newProgramme.id,
      humanReadableId: newProgramme.humanReadableId,
      name: newProgramme.name,
      startDate: newProgramme.startDate,
      maxClients: newProgramme.maxClients,
      sessionsDescription: newProgramme.sessionsDescription as any,
      programmeCost: newProgramme.programmeCost.toNumber(),
      notes: newProgramme.notes,
      adhocData: newProgramme.adhocData as any,
      createdAt: newProgramme.createdAt,
      updatedAt: newProgramme.updatedAt,
    };

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: programmeData,
    };
  } catch (err: any) {
    console.error("Error duplicating programme:", err);

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

/**
 * Programme Enrolment Server Actions
 */

export async function readProgrammeEnrolments(
  programmeId: string
): Promise<ActionResult<any[]>> {
  try {
    const enrolments = await prisma.programmeEnrolment.findMany({
      where: { programId: programmeId },
      include: {
        programme: true,
      },
    });

    // Get client details for each enrolment
    const enrolmentsWithClients = await Promise.all(
      enrolments.map(async (enrolment) => {
        const client = await prisma.client.findUnique({
          where: { id: enrolment.clientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            contactInfo: true,
          },
        });

        return {
          id: enrolment.id,
          clientId: enrolment.clientId,
          clientFirstName: client?.firstName || "Unknown",
          clientLastName: client?.lastName || "Unknown",
          contactInfo: client?.contactInfo || [],
          notes: enrolment.notes,
          createdAt: enrolment.createdAt,
          updatedAt: enrolment.updatedAt,
        };
      })
    );

    return {
      success: true,
      data: enrolmentsWithClients,
    };
  } catch (err: any) {
    console.error("Error reading programme enrolments:", err);

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

export async function addClientToProgramme(
  programmeId: string,
  clientId: string,
  startDate: Date,
  numberOfWeeks: number,
  notes?: string
): Promise<ActionResult<any>> {
  try {
    // Check if client is already enrolled
    const existingEnrolment = await prisma.programmeEnrolment.findFirst({
      where: {
        programId: programmeId,
        clientId: clientId,
      },
    });

    if (existingEnrolment) {
      return {
        success: false,
        message: "Client is already enrolled in this programme.",
        code: "CLIENT_ALREADY_ENROLLED",
      };
    }

    // Check programme capacity
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      select: {
        name: true,
        programmeCost: true,
        maxClients: true,
        _count: {
          select: { enrolments: true },
        },
      },
    });

    if (!programme) {
      return {
        success: false,
        message: "Programme not found.",
        code: "PROGRAMME_NOT_FOUND",
      };
    }

    if (programme._count.enrolments >= programme.maxClients) {
      return {
        success: false,
        message: "Programme is at maximum capacity.",
        code: "PROGRAMME_FULL",
      };
    }

    // Create enrolment
    const enrolment = await prisma.programmeEnrolment.create({
      data: {
        programId: programmeId,
        clientId: clientId,
        notes: notes || null,
      },
    });

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: enrolment,
    };
  } catch (err: any) {
    console.error("Error adding client to programme:", err);

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

export async function removeClientFromProgramme(
  enrolmentId: string
): Promise<ActionResult<any>> {
  try {
    const enrolment = await prisma.programmeEnrolment.delete({
      where: { id: enrolmentId },
    });

    revalidatePath("/dashboard/admin/programmes");

    return {
      success: true,
      data: enrolment,
    };
  } catch (err: any) {
    console.error("Error removing client from programme:", err);

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

export async function searchClients(
  searchTerm: string
): Promise<ClientSearchResult[]> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: "insensitive" } },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        authId: true, // Select authId to fetch email
      },
      take: 10, // Limit results
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const clientAuthIds = clients.map((c) => c.authId).filter((id) => id) as string[];
    const relatedUsers = await prisma.user.findMany({
      where: {
        id: { in: clientAuthIds },
      },
      select: { id: true, email: true },
    });

    return clients.map((client) => {
      const user = relatedUsers.find((u) => u.id === client.authId);
      return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: user?.email || null,
      };
    });
  } catch (err: any) {
    console.error("Error searching clients:", err);
    // Return an empty array on error, as the combobox expects an array
    return [];
  }
}
