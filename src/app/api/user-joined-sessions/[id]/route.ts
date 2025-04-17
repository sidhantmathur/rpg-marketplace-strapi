import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id; // ✅ avoid inline destructuring

  const bookings = await prisma.booking.findMany({
    where: { userId: id },
    select: { sessionId: true },
  });

  return NextResponse.json(bookings);
}
