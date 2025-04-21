// app/api/session/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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

    const session = await prisma.session.findUnique({
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

export async function PATCH(request: NextRequest, context: any) {
  try {
    const rawId = context.params.id
    console.log('✏️  PATCH /api/session/[id] → id=', rawId)
    const id = Number(rawId)
    const { imageUrl } = await request.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const rawId = context.params.id
    console.log('❌ DELETE /api/session/[id] → id=', rawId)
    const id = Number(rawId)
    await prisma.session.delete({ where: { id } })
    return NextResponse.json(null, { status: 204 })
  } catch (err) {
    return handleError(err)
  }
}
