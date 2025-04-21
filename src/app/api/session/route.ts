import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const {
      title,
      date,
      dmId,      // DungeonMaster.id
      userId,    // host’s Profile.id  (author of the session)
      description,
      duration,
      maxParticipants = 5,
      imageUrl,
    } = await req.json();

    if (!title || !date || !dmId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // one transaction: create session ➜ create host booking
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          title,
          date: new Date(date),
          dmId: Number(dmId),
          userId,
          maxParticipants,
          description,
          duration: duration ? Number(duration) : null,
          imageUrl,
        },
      });

      // auto‑book the host so reviews work later
      await tx.booking.create({
        data: {
          sessionId: created.id,
          userId,               // host’s Profile.id
        },
      });

      return created;
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error('POST /api/session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
