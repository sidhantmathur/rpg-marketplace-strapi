import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/sendEmail";
import prisma from "@/lib/prisma";

interface BookingRequest {
  sessionId: string | number;
  userId: string;
}

interface SessionWithBookingsAndDM {
  id: number;
  title: string;
  date: Date;
  maxParticipants: number;
  dmId: number;
  bookings: Array<{ userId: string }>;
  waitlist: Array<{ userId: string }>;
  dm: { userId: string } | null;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = (await req.json()) as BookingRequest;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = (await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, dm: true },
    })) as SessionWithBookingsAndDM | null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const alreadyJoined = session.bookings.some((b) => b.userId === userId);
    if (alreadyJoined) {
      return NextResponse.json({ error: "You already joined this session" }, { status: 400 });
    }

    if (session.bookings.length >= session.maxParticipants) {
      return NextResponse.json({ error: "Session is full" }, { status: 400 });
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
      prisma.dungeonMaster
        .findUnique({
          where: { id: session.dmId },
        })
        .then((dm) => (dm ? prisma.profile.findUnique({ where: { id: dm.userId } }) : null)),
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
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, userId } = (await req.json()) as BookingRequest;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = (await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, waitlist: true },
    })) as SessionWithBookingsAndDM | null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const booking = await prisma.booking.delete({
      where: {
        sessionId_userId: {
          sessionId: Number(sessionId),
          userId,
        },
      },
    });

    // Move first person from waitlist to booking if any
    if (session.waitlist.length > 0) {
      const firstWaitlist = session.waitlist[0];
      await prisma.booking.create({
        data: {
          sessionId: Number(sessionId),
          userId: firstWaitlist.userId,
        },
      });
      await prisma.waitlist.delete({
        where: {
          sessionId_userId: {
            sessionId: Number(sessionId),
            userId: firstWaitlist.userId,
          },
        },
      });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("DELETE /api/bookings unexpected error:", error);
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}
