"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export interface ClientForTrainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  gender?: string;
}

export async function fetchClientsForTrainer(query?: string): Promise<ClientForTrainer[]> {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.roles || // Ensure roles array exists
    !session.user.roles.some(role =>
      ([UserRole.SystemAdmin, UserRole.Admin, UserRole.Trainer] as UserRole[]).includes(role)
    )
  ) {
    throw new Error("Unauthorized");
  }

  try {
    let whereClause: any = {};

    if (query) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          email: { contains: query, mode: "insensitive" },
        },
        select: { id: true },
      });

      const matchingUserAuthIds = matchingUsers.map(user => user.id);

      whereClause.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ];

      if (matchingUserAuthIds.length > 0) {
        whereClause.OR.push({ authId: { in: matchingUserAuthIds } });
      } else if (
        !whereClause.OR[0].firstName.contains &&
        !whereClause.OR[1].lastName.contains
      ) {
        whereClause.id = "";
      }
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        avatarUrl: true,
        contactInfo: true,
        authId: true,
        gender: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    const clientsWithEmails = await Promise.all(clients.map(async (client) => {
        let userEmail = "N/A";
        let phone: string | undefined;
        try {
            const user = await prisma.user.findUnique({
                where: { id: client.authId },
                select: { email: true }
            });
            userEmail = user?.email || "N/A";
            if (Array.isArray(client.contactInfo)) {
                const primaryPhone = client.contactInfo.find(info => (info as any).type === 'phone' && (info as any).primary === true);
                if (primaryPhone) {
                    phone = (primaryPhone as any).value;
                }
            } else if (typeof client.contactInfo === 'object' && client.contactInfo !== null) {
                if ((client.contactInfo as any).type === 'phone' && (client.contactInfo as any).primary === true) {
                    phone = (client.contactInfo as any).value;
                } else if ((client.contactInfo as any).phone) {
                    phone = (client.contactInfo as any).phone;
                }
            }
        } catch (error) {
            console.error(`Error fetching user/contact info for client ID ${client.id} (authId: ${client.authId}):`, error);
            userEmail = "Error fetching email";
        }

        const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
        
        return {
            id: client.id,
            name: fullName,
            email: userEmail,
            phone: phone || undefined,
            dateOfBirth: client.birthDate?.toISOString().split('T')[0],
            avatarUrl: client.avatarUrl || undefined,
            gender: client.gender || undefined,
        };
    }));

    return clientsWithEmails;
  } catch (error) {
    console.error("Error fetching clients for trainer at top level:", error);
    throw new Error("Failed to fetch clients.");
  }
}
