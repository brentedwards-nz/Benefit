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

        // Check if enrolment exists
        const existingEnrolment = await prisma.programmeEnrolment.findUnique({
            where: { id }
        })
        if (!existingEnrolment) {
            return NextResponse.json({ error: 'Programme enrolment not found' }, { status: 404 })
        }

        const body = await request.json()
        const { notes, adhocData } = body

        // Update programme enrolment
        const updatedEnrolment = await prisma.programmeEnrolment.update({
            where: { id },
            data: {
                notes,
                adhocData: adhocData || {}
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

        return NextResponse.json(updatedEnrolment)
    } catch (error) {
        console.error('Error updating programme enrolment:', error)
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

        // Check if enrolment exists
        const existingEnrolment = await prisma.programmeEnrolment.findUnique({
            where: { id }
        })
        if (!existingEnrolment) {
            return NextResponse.json({ error: 'Programme enrolment not found' }, { status: 404 })
        }

        // Delete programme enrolment
        await prisma.programmeEnrolment.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Programme enrolment deleted successfully' })
    } catch (error) {
        console.error('Error deleting programme enrolment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 