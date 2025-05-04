import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendReviewRequest } from "@/utils/emailTemplates";

export async function GET(req: NextRequest) {
  try {
    // Get all sessions that ended in the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const endedSessions = await prisma.session.findMany({
      where: {
        date: {
          lt: now,
          gte: yesterday,
        },
      },
      include: {
        bookings: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    // Send review requests for each session
    for (const session of endedSessions) {
      for (const booking of session.bookings) {
        if (booking.user.email) {
          await sendReviewRequest(
            {
              title: session.title,
              date: session.date,
              id: session.id,
            },
            { email: booking.user.email },
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending review requests:", error);
    return NextResponse.json(
      { error: "Failed to send review requests" },
      { status: 500 },
    );
  }
}
