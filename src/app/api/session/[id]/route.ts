// app/api/session/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// Prisma singleton (same as your other files)
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET /api/session/[id]
export async function GET(request: NextRequest, context: any) {
  const id = Number(context.params.id)
  const session = await prisma.session.findUnique({
    where: { id },
    include: { dm: true, bookings: { include: { user: true } } },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}

// PATCH /api/session/[id]
export async function PATCH(request: NextRequest, context: any) {
  const id = Number(context.params.id)
  const { imageUrl } = await request.json()
  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }
  try {
    const updated = await prisma.session.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/session/[id]
export async function DELETE(request: NextRequest, context: any) {
  const id = Number(context.params.id)
  await prisma.session.delete({ where: { id } })
  return NextResponse.json(null, { status: 204 })
}
