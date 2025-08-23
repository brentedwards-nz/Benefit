// frontend/src/server-actions/trainer/clients/actions.ts
"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export interface ClientForTrainer {
  id: string;
  name: string;
  email: string;
  phone?: string; // Assuming phone might be part of contactInfo or added directly
  dateOfBirth?: string; // Date stored as string for simplicity in transfer
  avatarUrl?: string;
}

export async function fetchClientsForTrainer(query?: string): Promise<ClientForTrainer[]> {
  const session = await getServerSession(authOptions);

  // Temporarily disable role check for debugging
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

  console.log("Fetching clients for trainer. User role:", session?.user?.roles, "Query:", query);

  try {
    const whereClause: any = query ? {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { auth: { email: { contains: query, mode: "insensitive" } } }, // Search by email from User model
      ],
    } : {}; // If no query, return all clients

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        avatarUrl: true,
        contactInfo: true,
        authId: true, // Needed to link to User for email
      },
      orderBy: {
        firstName: "asc",
      },
    });

    console.log("Prisma found clients:", clients);

    const clientsWithEmails = await Promise.all(clients.map(async (client) => {
        let userEmail = "N/A";
        let phone: string | undefined;
        try {
            console.log(`Attempting to fetch user for client.authId: ${client.authId}`);
            const user = await prisma.user.findUnique({
                where: { id: client.authId },
                select: { email: true }
            });
            userEmail = user?.email || "N/A";
            // Extract phone from contactInfo if it exists and is an array of objects
            if (Array.isArray(client.contactInfo)) {
                const primaryPhone = client.contactInfo.find(info => (info as any).type === 'phone' && (info as any).primary === true);
                if (primaryPhone) {
                    phone = (primaryPhone as any).value;
                }
            } else if (typeof client.contactInfo === 'object' && client.contactInfo !== null) {
                // Handle case where contactInfo might be a single object for phone
                if ((client.contactInfo as any).type === 'phone' && (client.contactInfo as any).primary === true) {
                    phone = (client.contactInfo as any).value;
                } else if ((client.contactInfo as any).phone) {
                    phone = (client.contactInfo as any).phone; // Fallback for simple phone field
                }
            }
        } catch (error) {
            console.error(`Error fetching user/contact info for client ID ${client.id} (authId: ${client.authId}):`, error);
            userEmail = "Error fetching email"; // Indicate error in UI
        }

        const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
        
        return {
            id: client.id,
            name: fullName,
            email: userEmail,
            phone: phone || undefined,
            dateOfBirth: client.birthDate?.toISOString().split('T')[0],
            avatarUrl: client.avatarUrl || undefined,
        };
    }));

    console.log("Formatted clients for trainer:", clientsWithEmails);
    return clientsWithEmails;
  } catch (error) {
    console.error("Error fetching clients for trainer at top level:", error);
    throw new Error("Failed to fetch clients.");
  }
}
