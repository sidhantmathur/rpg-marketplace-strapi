import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { id, email, roles } = body;

  if (!id || !email || !roles) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      id,
      email,
      roles,
    },
  });

  return NextResponse.json(profile);
}
