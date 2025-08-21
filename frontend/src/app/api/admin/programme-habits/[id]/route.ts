import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/utils/prisma/client'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

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

        // Check if programme habit exists
        const existingProgrammeHabit = await prisma.programmeHabit.findUnique({
            where: { id }
        })
        if (!existingProgrammeHabit) {
            return NextResponse.json({ error: 'Programme habit not found' }, { status: 404 })
        }

        const body = await request.json()
        const { notes, monFrequency, tueFrequency, wedFrequency, thuFrequency, friFrequency, satFrequency, sunFrequency, current } = body

        // Update programme habit
        const updatedProgrammeHabit = await prisma.programmeHabit.update({
            where: { id },
            data: {
                notes,
                monFrequency,
                tueFrequency,
                wedFrequency,
                thuFrequency,
                friFrequency,
                satFrequency,
                sunFrequency,
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

        return NextResponse.json(updatedProgrammeHabit)
    } catch (error) {
        console.error('Error updating programme habit:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

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

        // Check if programme habit exists
        const existingProgrammeHabit = await prisma.programmeHabit.findUnique({
            where: { id }
        })
        if (!existingProgrammeHabit) {
            return NextResponse.json({ error: 'Programme habit not found' }, { status: 404 })
        }

        // Delete programme habit
        await prisma.programmeHabit.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Programme habit deleted successfully' })
    } catch (error) {
        console.error('Error deleting programme habit:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 