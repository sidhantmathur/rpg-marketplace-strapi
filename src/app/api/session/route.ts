import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { title, date, dmId } = body;

  if (!title || !date || !dmId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const session = await prisma.session.create({
    data: {
      title,
      date: new Date(date),
      dmId: Number(dmId),
    },
  });

  return NextResponse.json(session);
}

export async function GET() {
  const sessions = await prisma.session.findMany({
    include: {
      dm: true,
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(sessions);
}
