import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/utils/sendEmail";

export async function POST(req: NextRequest) {
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

    // Check if already on waitlist
    const alreadyOnWaitlist = session.waitlist.some((w) => w.userId === userId);
    if (alreadyOnWaitlist) {
      return NextResponse.json(
        { error: "You are already on the waitlist" },
        { status: 400 },
      );
    }

    // Check if already booked
    const alreadyBooked = session.bookings.some((b) => b.userId === userId);
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "You are already booked for this session" },
        { status: 400 },
      );
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: { sessionId: Number(sessionId), userId },
    });

    // Get user and DM info for notification
    const [user, dm] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.dungeonMaster.findUnique({
        where: { id: session.dmId },
      }),
    ]);

    // Send notification to DM
    if (dm) {
      const dmProfile = await prisma.profile.findUnique({
        where: { id: dm.userId },
      });
      if (dmProfile?.email) {
        await sendEmail({
          to: dmProfile.email,
          subject: "New Waitlist Entry",
          html: `A new user has joined the waitlist for your session "${session.title}".`,
        });
      }
    }

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
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

    const waitlistEntry = await prisma.waitlist.delete({
      where: {
        sessionId_userId: {
          sessionId: Number(sessionId),
          userId,
        },
      },
    });

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error removing from waitlist:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
