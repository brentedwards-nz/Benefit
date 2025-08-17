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

        // Fetch all clients
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                contactInfo: true,
                roles: true
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 