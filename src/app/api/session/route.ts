import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const body = await req.json();
    const { title, date, dmId, userId } = body;
  
    if (!title || !date || !dmId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
  
    const session = await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        dmId: Number(dmId),
        userId,
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
            select: { email: true }
          }
        }
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
    // 👇 Need to remove all bookings before able to delete a session
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
