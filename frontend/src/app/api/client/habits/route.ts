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

        // Resolve client authId: allow optional clientId query param (authId)
        const { searchParams } = new URL(request.url)
        const requestedAuthId = searchParams.get('clientId') || session.user.id

        // Get client by authId
        const client = await prisma.client.findUnique({
            where: { authId: requestedAuthId },
            select: { id: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Fetch programme habits for programmes the client is enrolled in
        const programmeHabits = await prisma.programmeHabit.findMany({
            where: {
                programme: {
                    enrolments: {
                        some: {
                            clientId: client.id
                        }
                    }
                },
                current: true
            },
            include: {
                programme: {
                    select: {
                        id: true,
                        name: true,
                        humanReadableId: true,
                        startDate: true,
                        endDate: true
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        notes: true
                    }
                },
                                _count: { select: { clientHabits: true } }
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