// app/api/session/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/utils/sendEmail'

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
  context: any
) {
  try {
    const id = Number(context.params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      date,
      duration,
      game,
      genre,
      experienceLevel,
      maxParticipants,
      tags,
      imageUrl
    } = body;

    // Update the session
    const updatedSession = await prismaSingleton.session.update({
      where: { id },
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        game,
        genre,
        experienceLevel,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        imageUrl,
        tags: tags ? {
          deleteMany: {}, // Remove all existing tags
          create: tags.map((tag: string) => ({
            name: tag,
          })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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

    // Check if this is a user removal request
    const { userId } = await request.json();
    if (userId) {
      // Get session and user info for notifications
      const [session, user] = await Promise.all([
        prismaSingleton.session.findUnique({
          where: { id },
          include: { dm: true }
        }),
        prismaSingleton.profile.findUnique({
          where: { id: userId }
        })
      ]);

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Delete the booking
      await prismaSingleton.booking.delete({
        where: {
          sessionId_userId: {
            sessionId: id,
            userId
          }
        }
      });

      // Send notification to the removed user
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `Removed from Session: ${session.title}`,
          html: `<p>You have been removed from the session <strong>${session.title}</strong> scheduled on ${new Date(
            session.date
          ).toLocaleString()}.</p>`,
        });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // If no userId provided, delete the entire session
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
