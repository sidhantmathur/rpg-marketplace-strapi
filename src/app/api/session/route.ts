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

  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Could not delete session' }, { status: 500 });
  }
}
