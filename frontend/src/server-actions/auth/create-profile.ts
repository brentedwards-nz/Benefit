"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createUserProfile(userId: string, userData: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
}) {
    try {
        // Check if profile already exists
        const existingProfile = await prisma.profile.findUnique({
            where: { auth_id: userId }
        });

        if (existingProfile) {
            console.log(`Profile already exists for user: ${userId}`);
            return { success: true, message: "Profile already exists" };
        }

        // Parse name into first and last name
        const nameParts = userData.name?.split(' ') || [];
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;

        // Create the profile
        const profile = await prisma.profile.create({
            data: {
                auth_id: userId,
                first_name: firstName,
                last_name: lastName,
                current: true,
                disabled: false,
                avatar_url: userData.image || null,
                contact_info: userData.email ? [
                    {
                        type: "email",
                        value: userData.email,
                        primary: true,
                        label: "Primary Email"
                    }
                ] : []
            }
        });

        console.log(`Profile created for user: ${userId}`);
        return { success: true, data: profile };
    } catch (error) {
        console.error('Error creating profile:', error);
        return { success: false, error: "Failed to create profile" };
    }
}

export async function ensureUserProfile() {
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