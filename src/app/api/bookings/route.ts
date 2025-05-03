import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/utils/sendEmail';

import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, dm: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const alreadyJoined = session.bookings.some((b) => b.userId === userId);
    if (alreadyJoined) {
      return NextResponse.json({ error: 'You already joined this session' }, { status: 400 });
    }

    if (session.bookings.length >= session.maxParticipants) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: { sessionId: Number(sessionId), userId },
    });

    // Verify DM exists and has a valid userId
    if (!session.dm || !session.dm.userId) {
      console.error("Session DM or DM's userId missing:", session.dm);
      return NextResponse.json(
        { error: "Session Dungeon Master data invalid or incomplete." },
        { status: 500 }
      );
    }

    const [user, dmProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { id: session.dm.userId } }),
    ]);

    if (user && dmProfile) {
      await sendEmail({
        to: user.email,
        subject: `Booking Confirmed: ${session.title}`,
        html: `<p>You successfully joined <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });

      await sendEmail({
        to: dmProfile.email,
        subject: `New Booking: ${session.title}`,
        html: `<p>${user.email} has joined your session <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });
    } else {
      console.error("Missing user or DM Profile:", { user, dmProfile });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("POST /api/bookings unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, waitlist: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const booking = await prisma.booking.delete({
      where: {
        sessionId_userId: {
          sessionId: Number(sessionId),
          userId,
        },
      },
    });

    // If there are people on the waitlist, notify the first person
    if (session.waitlist.length > 0) {
      const firstWaitlistEntry = session.waitlist[0];
      const waitlistUser = await prisma.profile.findUnique({
        where: { id: firstWaitlistEntry.userId },
      });

      if (waitlistUser) {
        // Send notification to waitlist user
        await sendEmail({
          to: waitlistUser.email,
          subject: 'Session Spot Available',
          html: `
            <p>A spot has opened up in the session "${session.title}"!</p>
            <p>Click <a href="/session/${session.id}">here</a> to book your spot before it's gone.</p>
          `,
        });

        // Remove from waitlist
        await prisma.waitlist.delete({
          where: {
            sessionId_userId: {
              sessionId: Number(sessionId),
              userId: firstWaitlistEntry.userId,
            },
          },
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
