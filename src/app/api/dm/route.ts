import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { name } = body;

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const dm = await prisma.dungeonMaster.create({
    data: { name },
  });

  return NextResponse.json(dm);
}

export async function GET() {
  const dms = await prisma.dungeonMaster.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(dms);
}
