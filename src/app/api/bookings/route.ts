import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { sessionId, userId } = await req.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        sessionId,
        userId,
      },
    });

    return NextResponse.json(booking);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Already joined' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
