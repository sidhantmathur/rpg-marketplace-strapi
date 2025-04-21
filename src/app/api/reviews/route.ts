import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { recalcRating } from '@/lib/recalcRating';   // helper from previous message

// Prisma singleton ---------------------------------------------------------
const gp = global as unknown as { prisma?: PrismaClient };
const prisma = gp.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') gp.prisma = prisma;

// POST /api/reviews  -------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { sessionId, targetId, authorId, rating, comment } = await req.json();

    // ----- basic validation (manual) -------------------------------------
    if (
      !sessionId ||
      !targetId ||
      !authorId ||
      typeof rating !== 'number' ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    if (authorId === targetId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 });
    }

    // Both users must have a booking for that session
    const bookings = await prisma.booking.findMany({
      where: { sessionId, userId: { in: [authorId, targetId] } },
      select: { userId: true },
    });
    if (bookings.length !== 2) {
      return NextResponse.json({ error: 'Both users must attend the session' }, { status: 400 });
    }

    // Session must be in the past
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.date > new Date()) {
      return NextResponse.json({ error: 'Session not yet completed' }, { status: 400 });
    }

    // Create review & update aggregates in one transaction
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { rating, comment, authorId, targetId, sessionId },
      });
      await recalcRating(targetId);
      return created;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/reviews?targetId=xyz&page=1&limit=10  ---------------------------
export async function GET(req: NextRequest) {
  const targetId = req.nextUrl.searchParams.get('targetId');
  if (!targetId)
    return NextResponse.json({ error: 'targetId query param required' }, { status: 400 });

  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  const limit = Number(req.nextUrl.searchParams.get('limit') || 10);

  const reviews = await prisma.review.findMany({
    where: { targetId, deleted: false },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json(reviews);
}
