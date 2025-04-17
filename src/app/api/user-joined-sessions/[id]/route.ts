import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  const bookings = await prisma.booking.findMany({
    where: { userId: id },
    select: { sessionId: true },
  });

  return NextResponse.json(bookings);
}
