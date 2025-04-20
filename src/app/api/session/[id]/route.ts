// app/api/session/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      dm: true,
      bookings: { include: { user: true } },
    },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await request.json()
  if (!body.imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }
  try {
    const updated = await prisma.session.update({
      where: { id },
      data: { imageUrl: body.imageUrl },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await prisma.session.delete({ where: { id } })
  return NextResponse.json(null, { status: 204 })
}
