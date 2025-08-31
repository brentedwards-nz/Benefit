"use server";

import prisma from "@/utils/prisma/client";
import { ActionResult } from "@/types/server-action-results";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { $Enums } from "@prisma/client";

export type ClientSearchResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export async function searchClients(
  searchTerm: string
): Promise<ClientSearchResult[]> {
  if (!searchTerm) {
    return [];
  }

  // Find users by email first
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { authId: { in: userIds } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      authId: true,
    },
    take: 20,
  });

  const clientAuthIds = clients.map((c) => c.authId);
  const relatedUsers = await prisma.user.findMany({
    where: {
      id: { in: clientAuthIds.filter((id) => id) as string[] },
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
}

export async function readAllClients(): Promise<
  ActionResult<ClientSearchResult[]>
> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  try {
    if (
      !session.user.roles ||
      (!session.user.roles.includes($Enums.UserRole.Admin) &&
        !session.user.roles.includes($Enums.UserRole.SystemAdmin))
    ) {
      return {
        success: false,
        message: "You are not authorized to view all clients.",
        code: "UNAUTHORIZED",
      };
    }
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

  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        authId: true,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

    const clientAuthIds = clients
      .map((c) => c.authId)
      .filter((id) => id) as string[];
    const relatedUsers = await prisma.user.findMany({
      where: {
        id: { in: clientAuthIds },
      },
      select: { id: true, email: true },
    });

    const data = clients.map((client) => {
      const user = relatedUsers.find((u) => u.id === client.authId);
      return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: user?.email || null,
      };
    });

    return {
      success: true,
      data: data,
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