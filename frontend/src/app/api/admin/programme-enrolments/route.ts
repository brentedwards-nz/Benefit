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
        const whereClause = programmeId ? { programId: programmeId } : {}

        // Fetch programme enrolments with related data
        const enrolments = await prisma.programmeEnrolment.findMany({
            where: whereClause,
            include: {
                programme: {
                    select: {
                        id: true,
                        name: true,
                        humanReadableId: true,
                        maxClients: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        contactInfo: true
                    }
                }
            },
            orderBy: [
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(enrolments)
    } catch (error) {
        console.error('Error fetching programme enrolments:', error)
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
        const { programId, clientId, notes, adhocData } = body

        // Validation
        if (!programId || !clientId) {
            return NextResponse.json(
                { error: 'Programme ID and Client ID are required' },
                { status: 400 }
            )
        }

        // Check if programme exists
        const programme = await prisma.programme.findUnique({
            where: { id: programId }
        })
        if (!programme) {
            return NextResponse.json({ error: 'Programme not found' }, { status: 404 })
        }

        // Check if client exists
        const clientRecord = await prisma.client.findUnique({
            where: { id: clientId }
        })
        if (!clientRecord) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Check if client is already enrolled in this programme
        const existingEnrolment = await prisma.programmeEnrolment.findFirst({
            where: {
                programId,
                clientId
            }
        })
        if (existingEnrolment) {
            return NextResponse.json(
                { error: 'Client is already enrolled in this programme' },
                { status: 409 }
            )
        }

        // Check if programme has reached max capacity
        const currentEnrolments = await prisma.programmeEnrolment.count({
            where: { programId }
        })
        if (currentEnrolments >= programme.maxClients) {
            return NextResponse.json(
                { error: 'Programme has reached maximum capacity' },
                { status: 409 }
            )
        }

        // Create programme enrolment
        const enrolment = await prisma.programmeEnrolment.create({
            data: {
                programId,
                clientId,
                notes,
                adhocData: adhocData || {},
                programmeTemplateId: programme.programmeTemplateId
            },
            include: {
                programme: {
                    select: {
                        id: true,
                        name: true,
                        humanReadableId: true,
                        maxClients: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        contactInfo: true
                    }
                }
            }
        })

        return NextResponse.json(enrolment, { status: 201 })
    } catch (error) {
        console.error('Error creating programme enrolment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 