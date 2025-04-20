import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';


export async function POST(req: Request) {
  const body = await req.json();
  const { title, date, dmId, userId, description, duration, maxParticipants, imageUrl } = body;

  if (!title || !date || !dmId || !userId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const session = await prisma.session.create({
    data: {
      title,
      date: new Date(date),
      dmId: Number(dmId),
      userId,
      maxParticipants: maxParticipants ?? 5,
      description,
      duration: duration ? Number(duration) : null,
      imageUrl,
    },
  });

  return NextResponse.json(session);
}

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: 'asc' },
    include: {
      dm: { select: { name: true } },
      bookings: {
        select: {
          userId: true,
          user: {
            select: { email: true },
          },
        },
      },
    },
  });

  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    // Remove bookings first due to foreign key constraint
    await prisma.booking.deleteMany({
      where: { sessionId: Number(sessionId) },
    });
    await prisma.session.delete({
      where: { id: Number(sessionId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE /session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
