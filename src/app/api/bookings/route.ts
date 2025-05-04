import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/sendEmail";

import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, dm: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const alreadyJoined = session.bookings.some((b) => b.userId === userId);
    if (alreadyJoined) {
      return NextResponse.json(
        { error: "You already joined this session" },
        { status: 400 },
      );
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
        { status: 500 },
      );
    }

    const [user, dmProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.dungeonMaster
        .findUnique({
          where: { id: session.dmId },
        })
        .then((dm) =>
          dm ? prisma.profile.findUnique({ where: { id: dm.userId } }) : null,
        ),
    ]);

    if (user && dmProfile) {
      await sendEmail({
        to: user.email,
        subject: `Booking Confirmed: ${session.title}`,
        html: `<p>You successfully joined <strong>${session.title}</strong> scheduled on ${new Date(
          session.date,
        ).toLocaleString()}.</p>`,
      });

      await sendEmail({
        to: dmProfile.email,
        subject: `New Booking: ${session.title}`,
        html: `<p>${user.email} has joined your session <strong>${session.title}</strong> scheduled on ${new Date(
          session.date,
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
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, waitlist: true },
    });

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

    // Get user and DM info for notifications
    const [user, dmProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.dungeonMaster
        .findUnique({
          where: { id: session.dmId },
        })
        .then((dm) =>
          dm ? prisma.profile.findUnique({ where: { id: dm.userId } }) : null,
        ),
    ]);

    // Notify DM that user left
    if (dmProfile?.email && user) {
      await sendEmail({
        to: dmProfile.email,
        subject: `User Left Session: ${session.title}`,
        html: `<p>${user.email} has left your session <strong>${session.title}</strong> scheduled on ${new Date(
          session.date,
        ).toLocaleString()}.</p>`,
      });
    }

    // If there are people on the waitlist, notify all of them
    if (session.waitlist.length > 0) {
      const waitlistUsers = await prisma.profile.findMany({
        where: {
          id: {
            in: session.waitlist.map((w) => w.userId),
          },
        },
      });

      // Send notification to all waitlist users
      for (const waitlistUser of waitlistUsers) {
        if (waitlistUser.email) {
          await sendEmail({
            to: waitlistUser.email,
            subject: "Session Spot Available",
            html: `<p>A spot has become available in the session <strong>${session.title}</strong> scheduled on ${new Date(
              session.date,
            ).toLocaleString()}.</p>
            <p>Hurry to book your spot!</p>`,
          });
        }
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
