import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { sessionId, userId } = await req.json();
  
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: {
        bookings: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    // Check if already joined
    const alreadyJoined = session.bookings.some((b) => b.userId === userId);
    if (alreadyJoined) {
      return NextResponse.json({ error: 'You already joined this session' }, { status: 400 });
    }
  
    // Check if full
    if (session.bookings.length >= session.maxParticipants) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 });
    }
    const booking = await prisma.booking.create({
      data: {
        sessionId: Number(sessionId),
        userId,
      },
    });
    return NextResponse.json(booking);
  }

export async function DELETE(req: NextRequest) {
  const { sessionId, userId } = await req.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    await prisma.booking.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Could not leave session' }, { status: 500 });
  }
}
