import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const auth_id = session.user.id;

  try {
    const profile = await prisma.profile.findUnique({
      where: { auth_id },
      select: {
        first_name: true,
        last_name: true,
        birth_date: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
