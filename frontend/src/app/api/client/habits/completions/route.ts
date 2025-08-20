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

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
        }

        // Get client ID from session
        const client = await prisma.client.findUnique({
            where: { authId: session.user.id },
            select: { id: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Fetch habit completions for the client within the date range
        const completions = await prisma.clientHabits.findMany({
            where: {
                clientId: client.id,
                completionDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            orderBy: [
                { completionDate: 'asc' }
            ]
        })
        return NextResponse.json(completions)
    } catch (error) {
        console.error('Error fetching habit completions:', error)
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

        // Get client ID from session
        const client = await prisma.client.findUnique({
            where: { authId: session.user.id },
            select: { id: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        const body = await request.json()
        const { programmeHabitId, completionDate, completed, notes, delta } = body

        console.log('Received request body:', { programmeHabitId, completionDate, completed, notes })

        if (!programmeHabitId || !completionDate) {
            return NextResponse.json({ error: 'Programme habit ID and completion date are required' }, { status: 400 })
        }

        // Check if the client is enrolled in the programme for this date
        const programmeHabit = await prisma.programmeHabit.findUnique({
            where: { id: programmeHabitId },
            include: {
                programme: {
                    include: {
                        enrolments: {
                            where: {
                                clientId: client.id
                            }
                        }
                    }
                }
            }
        })

        if (!programmeHabit) {
            return NextResponse.json({ error: 'Programme habit not found' }, { status: 404 })
        }

        if (programmeHabit.programme.enrolments.length === 0) {
            return NextResponse.json({ error: 'Not enrolled in programme' }, { status: 403 })
        }

        // Check if completion already exists
        const existingCompletion = await prisma.clientHabits.findFirst({
            where: {
                programmeHabitId,
                clientId: client.id,
                completionDate: new Date(completionDate)
            }
        });

        let completion;
        try {
            // Determine required per day for this habit
            const programmeHabitDetails = await prisma.programmeHabit.findUnique({
                where: { id: programmeHabitId },
                select: { frequencyPerDay: true }
            });
            const requiredPerDay = Math.max(1, programmeHabitDetails?.frequencyPerDay ?? 1);

            const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
            const MAX_PER_DAY = 20; // safety upper bound

            if (existingCompletion) {
                const nextTimesDone = clamp(
                    (existingCompletion.timesDone ?? 0) + (typeof delta === 'number' ? delta : (completed ? 1 : -1)),
                    0,
                    MAX_PER_DAY
                );
                const nextCompleted = nextTimesDone >= requiredPerDay;
                completion = await prisma.clientHabits.update({
                    where: { id: existingCompletion.id },
                    data: {
                        timesDone: nextTimesDone,
                        completed: nextCompleted,
                        notes,
                        updatedAt: new Date()
                    },
                    include: {
                        programmeHabit: {
                            select: {
                                id: true,
                                programme: { select: { id: true, name: true } },
                                habit: { select: { id: true, title: true } },
                                frequencyPerDay: true
                            }
                        }
                    }
                });
            } else {
                const initialTimesDone = clamp(typeof delta === 'number' ? Math.max(delta, 0) : (completed ? 1 : 0), 0, MAX_PER_DAY);
                const initialCompleted = initialTimesDone >= requiredPerDay;
                completion = await prisma.clientHabits.create({
                    data: {
                        programmeHabitId,
                        clientId: client.id,
                        completionDate: new Date(completionDate),
                        timesDone: initialTimesDone,
                        completed: initialCompleted,
                        notes
                    },
                    include: {
                        programmeHabit: {
                            select: {
                                id: true,
                                programme: { select: { id: true, name: true } },
                                habit: { select: { id: true, title: true } },
                                frequencyPerDay: true
                            }
                        }
                    }
                });
            }
        } catch (dbError: any) {
            console.error('Database operation failed:', dbError);
            return NextResponse.json({
                error: 'Database operation failed',
                details: dbError?.message ?? 'Unknown database error'
            }, { status: 500 });
        }

        return NextResponse.json({ ...completion, requiredPerDay: completion.programmeHabit?.frequencyPerDay ?? 1 })
    } catch (error: any) {
        console.error('Error updating habit completion:', error)
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name
        })
        return NextResponse.json(
            { error: 'Internal server error', details: error?.message ?? 'Unknown error' },
            { status: 500 }
        )
    }
} 