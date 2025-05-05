import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSessionReminder } from "@/utils/emailTemplates";

export async function GET(_: NextRequest) {
  try {
    // Get all sessions starting in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingSessions = await prisma.session.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        dm: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Send reminders for each session
    for (const session of upcomingSessions) {
      // Get DM's email
      const dmProfile = await prisma.profile.findUnique({
        where: { id: session.dm.userId },
        select: { email: true },
      });

      if (!dmProfile?.email) continue;

      const participants = [
        ...session.bookings.map((b) => ({ email: b.user.email })),
        { email: dmProfile.email },
      ];

      await sendSessionReminder(
        {
          title: session.title,
          date: session.date,
          id: session.id,
        },
        participants
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending session reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
