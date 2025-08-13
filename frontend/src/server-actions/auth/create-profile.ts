"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function createUserProfile(userId: string, userData: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
}) {
    try {
        // Check if client already exists
        const existingClient = await prisma.client.findUnique({
            where: { authId: userId }
        });

        if (existingClient) {
            console.log(`Client already exists for user: ${userId}`);
            return { success: true, message: "Client already exists" };
        }

        // Parse name into first and last name
        const nameParts = userData.name?.split(' ') || [];
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;

        // Create the client
        const client = await prisma.client.create({
            data: {
                id: randomUUID(),
                authId: userId,
                firstName: firstName,
                lastName: lastName,
                current: true,
                disabled: false,
                avatarUrl: userData.image || null,
                contactInfo: userData.email ? [
                    {
                        type: "email",
                        value: userData.email,
                        primary: true,
                        label: "Primary Email"
                    }
                ] : []
            }
        });

        console.log(`Client created for user: ${userId}`);
        return { success: true, data: client };
    } catch (error) {
        console.error('Error creating client:', error);
        return { success: false, error: "Failed to create client" };
    }
}

export async function ensureUserClient() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: false, error: "No authenticated user" };
    }

    return await createUserProfile(session.user.id, {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
    });
} 