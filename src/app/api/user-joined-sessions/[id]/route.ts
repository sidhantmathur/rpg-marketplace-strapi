import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  const bookings = await prisma.booking.findMany({
    where: { userId: context.params.id },
    select: { sessionId: true },
  });

  return NextResponse.json(bookings);
}
