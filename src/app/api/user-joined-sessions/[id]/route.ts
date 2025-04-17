import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(_: NextRequest, context: any) {
  const bookings = await prisma.booking.findMany({
    where: { userId: context.params.id },
    select: { sessionId: true },
  });

  return NextResponse.json(bookings);
}
