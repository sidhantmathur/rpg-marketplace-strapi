import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/utils/sendEmail";

interface WaitlistRequest {
  sessionId: string | number;
  userId: string;
}

interface SessionWithBookingsAndWaitlist {
  id: number;
  title: string;
  date: Date;
  dmId: number;
  bookings: Array<{ userId: string }>;
  waitlist: Array<{ userId: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = (await req.json()) as WaitlistRequest;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = (await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, waitlist: true },
    })) as SessionWithBookingsAndWaitlist | null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if already on waitlist
    const alreadyOnWaitlist = session.waitlist.some((w) => w.userId === userId);
    if (alreadyOnWaitlist) {
      return NextResponse.json({ error: "You are already on the waitlist" }, { status: 400 });
    }

    // Check if already booked
    const alreadyBooked = session.bookings.some((b) => b.userId === userId);
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "You are already booked for this session" },
        { status: 400 }
      );
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: { sessionId: Number(sessionId), userId },
    });

    // Get user and DM info for notification
    const dm = await prisma.dungeonMaster.findUnique({
      where: { id: session.dmId },
    });

    if (!dm) {
      return NextResponse.json({ error: "Dungeon Master not found" }, { status: 404 });
    }

    const [user, dmProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { id: dm.userId } }),
    ]);

    if (user && dmProfile) {
      await sendEmail({
        to: user.email,
        subject: `Added to Waitlist: ${session.title}`,
        html: `<p>You have been added to the waitlist for <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });

      await sendEmail({
        to: dmProfile.email,
        subject: `New Waitlist Entry: ${session.title}`,
        html: `<p>${user.email} has been added to the waitlist for your session <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });
    }

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, userId } = (await req.json()) as WaitlistRequest;

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
    return NextResponse.json({ error: "Failed to remove from waitlist" }, { status: 500 });
  }
}
