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
        const {
            title,
            notes,
            monFrequency,
            tueFrequency,
            wedFrequency,
            thuFrequency,
            friFrequency,
            satFrequency,
            sunFrequency,
            current
        } = body;

        // Validate required fields
        if (!title) {
            return new Response("Title is required", { status: 400 });
        }

        const habit = await prisma.habit.create({
            data: {
                title,
                notes: notes || null,
                monFrequency: monFrequency || 0,
                tueFrequency: tueFrequency || 0,
                wedFrequency: wedFrequency || 0,
                thuFrequency: thuFrequency || 0,
                friFrequency: friFrequency || 0,
                satFrequency: satFrequency || 0,
                sunFrequency: sunFrequency || 0,
                current: current !== undefined ? current : true,
            }
        });

        return NextResponse.json(habit, { status: 201 });
    } catch (error) {
        console.error("Error creating habit:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
} 