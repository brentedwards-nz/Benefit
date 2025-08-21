import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/utils/prisma/client'

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user has Admin or SystemAdmin role
        const client = await prisma.client.findUnique({
            where: { authId: session.user.id },
            select: { roles: true }
        })

        if (!client || !client.roles.some(role => ['Admin', 'SystemAdmin'].includes(role))) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get programmeId from query params if filtering by specific programme
        const { searchParams } = new URL(request.url)
        const programmeId = searchParams.get('programmeId')

        // Build where clause
        const whereClause = programmeId ? { programmeId } : {}

        // Fetch programme habits with related data
        const programmeHabits = await prisma.programmeHabit.findMany({
            where: whereClause,
            include: {
                programme: {
                    select: {
                        id: true,
                        name: true,
                        humanReadableId: true
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        notes: true
                    }
                }
            },
            orderBy: [
                { programme: { name: 'asc' } },
                { habit: { title: 'asc' } }
            ]
        })

        return NextResponse.json(programmeHabits)
    } catch (error) {
        console.error('Error fetching programme habits:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user has Admin or SystemAdmin role
        const client = await prisma.client.findUnique({
            where: { authId: session.user.id },
            select: { roles: true }
        })

        if (!client || !client.roles.some(role => ['Admin', 'SystemAdmin'].includes(role))) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const body = await request.json()
        const { programmeId, habitId, notes, monFrequency, tueFrequency, wedFrequency, thuFrequency, friFrequency, satFrequency, sunFrequency, current } = body

        // Validation
        if (!programmeId || !habitId) {
            return NextResponse.json(
                { error: 'Programme ID and Habit ID are required' },
                { status: 400 }
            )
        }

        // Check if programme exists
        const programme = await prisma.programme.findUnique({
            where: { id: programmeId }
        })
        if (!programme) {
            return NextResponse.json({ error: 'Programme not found' }, { status: 404 })
        }

        // Check if habit exists
        const habit = await prisma.habit.findUnique({
            where: { id: habitId }
        })
        if (!habit) {
            return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
        }

        // Check if programme habit already exists
        const existingProgrammeHabit = await prisma.programmeHabit.findUnique({
            where: {
                programmeId_habitId: {
                    programmeId,
                    habitId
                }
            }
        })
        if (existingProgrammeHabit) {
            return NextResponse.json(
                { error: 'This habit is already assigned to this programme' },
                { status: 409 }
            )
        }

        // Create programme habit
        const programmeHabit = await prisma.programmeHabit.create({
            data: {
                programmeId,
                habitId,
                notes,
                monFrequency: monFrequency ?? 0,
                tueFrequency: tueFrequency ?? 0,
                wedFrequency: wedFrequency ?? 0,
                thuFrequency: thuFrequency ?? 0,
                friFrequency: friFrequency ?? 0,
                satFrequency: satFrequency ?? 0,
                sunFrequency: sunFrequency ?? 0,
                current
            },
            include: {
                programme: {
                    select: {
                        id: true,
                        name: true,
                        humanReadableId: true
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        notes: true
                    }
                }
            }
        })

        return NextResponse.json(programmeHabit, { status: 201 })
    } catch (error) {
        console.error('Error creating programme habit:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 