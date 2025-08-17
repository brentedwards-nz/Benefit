import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/utils/prisma/client";

// GET /api/admin/habits - Get all habits
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.roles?.includes("Admin")) {
            return new Response("Unauthorized", { status: 403 });
        }

        const habits = await prisma.habit.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(habits);
    } catch (error) {
        console.error("Error fetching habits:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

// POST /api/admin/habits - Create a new habit
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.roles?.includes("Admin")) {
            return new Response("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { title, notes, frequencyPerWeek, frequencyPerDay, current } = body;

        // Validate required fields
        if (!title || !frequencyPerWeek) {
            return new Response("Title and frequency are required", { status: 400 });
        }

        const habit = await prisma.habit.create({
            data: {
                title,
                notes: notes || null,
                frequencyPerWeek,
                frequencyPerDay: frequencyPerDay || null,
                current: current !== undefined ? current : true,
            }
        });

        return NextResponse.json(habit, { status: 201 });
    } catch (error) {
        console.error("Error creating habit:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
} 