import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

type Params = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { id } = params;
  const bookings = await prisma.booking.findMany({
    where: { userId: id },
    select: { sessionId: true },
  });
  
  return NextResponse.json(bookings);
}