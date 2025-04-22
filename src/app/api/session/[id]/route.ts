// app/api/session/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prismaSingleton = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaSingleton

async function handleError(err: unknown) {
  console.error('🔥 [api/session/[id]] uncaught error:', err)
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : 'Unknown error'
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function GET(request: NextRequest, context: any) {
  try {
    const rawId = context.params.id
    console.log('🛰  GET /api/session/[id] → id=', rawId)
    const id = Number(rawId)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
    }

    const session = await prismaSingleton.session.findUnique({
      where: { id },
      include: {
        dm: true,
        bookings: { include: { user: true } },
        reviews: {                        // ← NEW
          where: { deleted: false },
          orderBy: { createdAt: 'desc' },
          include: { author: true },
        },
      },
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(session)
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const updatedSession = await prismaSingleton.session.update({
      where: { id: parseInt(id) },
      data: { imageUrl },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const rawId = context.params.id
    console.log('❌ DELETE /api/session/[id] → id=', rawId)
    const id = Number(rawId)

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
    }

    // First delete all related bookings
    console.log('Deleting related bookings...')
    await prismaSingleton.booking.deleteMany({
      where: { sessionId: id }
    })

    // Delete all related reviews
    console.log('Deleting related reviews...')
    await prismaSingleton.review.deleteMany({
      where: { sessionId: id }
    })

    // Finally delete the session (this will cascade delete the tags relation)
    console.log('Deleting session...')
    await prismaSingleton.session.delete({ where: { id } })
    
    console.log('Session deleted successfully')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Error in DELETE /api/session/[id]:', err)
    return handleError(err)
  }
}
