import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';


export async function POST(req: Request) {
    const body = await req.json();
    const { name, userId } = body;
  
    if (!name || !userId) {
      return NextResponse.json({ error: 'Missing name or userId' }, { status: 400 });
    }
  
    const dm = await prisma.dungeonMaster.create({
      data: {
        name,
        userId,
      },
    });
  
    return NextResponse.json(dm);
  }
  

export async function GET() {
  const dms = await prisma.dungeonMaster.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(dms);
}
