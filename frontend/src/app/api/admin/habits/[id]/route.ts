import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/utils/prisma/client";

// PUT /api/admin/habits/[id] - Update a habit
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.roles?.includes("Admin")) {
            return new Response("Unauthorized", { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, notes, frequencyPerWeek, frequencyPerDay, current } = body;

        // Validate required fields
        if (!title || !frequencyPerWeek) {
            return new Response("Title and frequency are required", { status: 400 });
        }

        // Check if habit exists
        const existingHabit = await prisma.habit.findUnique({
            where: { id }
        });

        if (!existingHabit) {
            return new Response("Habit not found", { status: 404 });
        }

        const updatedHabit = await prisma.habit.update({
            where: { id },
            data: {
                title,
                notes: notes || null,
                frequencyPerWeek,
                frequencyPerDay: frequencyPerDay || null,
                current: current !== undefined ? current : true,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json(updatedHabit);
    } catch (error) {
        console.error("Error updating habit:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

// DELETE /api/admin/habits/[id] - Delete a habit
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.roles?.includes("Admin")) {
            return new Response("Unauthorized", { status: 403 });
        }

        const { id } = await params;

        // Check if habit exists
        const existingHabit = await prisma.habit.findUnique({
            where: { id }
        });

        if (!existingHabit) {
            return new Response("Habit not found", { status: 404 });
        }

        await prisma.habit.delete({
            where: { id }
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting habit:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
} 