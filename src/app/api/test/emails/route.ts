import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sendSessionReminder,
  sendSessionCancellation,
  sendReviewRequest,
  sendSessionModification,
  sendWelcomeEmail,
} from "@/utils/emailTemplates";

interface EmailTestRequest {
  type: string;
  sessionId?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { type, sessionId, email } = body as EmailTestRequest;

    if (!type) {
      return NextResponse.json({ error: "Email type is required" }, { status: 400 });
    }

    // For session-related emails, we need a session
    if (type !== "welcome" && !sessionId) {
      return NextResponse.json(
        { error: "Session ID is required for this email type" },
        { status: 400 }
      );
    }

    // For welcome email, we need an email address
    if (type === "welcome" && !email) {
      return NextResponse.json({ error: "Email is required for welcome email" }, { status: 400 });
    }

    switch (type) {
      case "reminder": {
        const session = await prisma.session.findUnique({
          where: { id: Number(sessionId) },
          include: {
            bookings: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
            dm: {
              select: { userId: true },
            },
          },
        });

        if (!session) {
          return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const dmProfile = await prisma.profile.findUnique({
          where: { id: session.dm.userId },
          select: { email: true },
        });

        if (!dmProfile?.email) {
          return NextResponse.json({ error: "DM profile not found" }, { status: 404 });
        }

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
        break;
      }

      case "cancellation": {
        const session = await prisma.session.findUnique({
          where: { id: Number(sessionId) },
          include: {
            bookings: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
            dm: {
              select: { userId: true },
            },
          },
        });

        if (!session) {
          return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const dmProfile = await prisma.profile.findUnique({
          where: { id: session.dm.userId },
          select: { email: true },
        });

        if (!dmProfile?.email) {
          return NextResponse.json({ error: "DM profile not found" }, { status: 404 });
        }

        const participants = [
          ...session.bookings.map((b) => ({ email: b.user.email })),
          { email: dmProfile.email },
        ];

        await sendSessionCancellation(
          {
            title: session.title,
            date: session.date,
            id: session.id,
          },
          participants,
          "Test cancellation reason"
        );
        break;
      }

      case "review": {
        const session = await prisma.session.findUnique({
          where: { id: Number(sessionId) },
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

        if (!session) {
          return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        console.warn("[Email Test] Processing session:", session.title);
        console.warn("[Email Test] Found bookings:", session.bookings.length);

        if (session.bookings.length === 0) {
          console.warn("[Email Test] No bookings found for session");
          return NextResponse.json({
            message: "No bookings found for this session",
            success: true,
          });
        }

        for (const booking of session.bookings) {
          console.warn("[Email Test] Processing booking for:", booking.user.email);
          if (booking.user.email) {
            console.warn("[Email Test] Sending review request to:", booking.user.email);
            try {
              await sendReviewRequest(
                {
                  title: session.title,
                  date: session.date,
                  id: session.id,
                },
                { email: booking.user.email }
              );
              console.warn("[Email Test] Review request sent successfully");
            } catch (error) {
              console.error("[Email Test] Failed to send review request:", error);
              return NextResponse.json(
                {
                  error: "Failed to send review request",
                  details: error,
                },
                { status: 500 }
              );
            }
          }
        }
        break;
      }

      case "modification": {
        const session = await prisma.session.findUnique({
          where: { id: Number(sessionId) },
          include: {
            bookings: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
            dm: {
              select: { userId: true },
            },
          },
        });

        if (!session) {
          return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const dmProfile = await prisma.profile.findUnique({
          where: { id: session.dm.userId },
          select: { email: true },
        });

        if (!dmProfile?.email) {
          return NextResponse.json({ error: "DM profile not found" }, { status: 404 });
        }

        const participants = [
          ...session.bookings.map((b) => ({ email: b.user.email })),
          { email: dmProfile.email },
        ];

        await sendSessionModification(
          {
            title: session.title,
            date: session.date,
            id: session.id,
          },
          participants,
          "Test modification: Session time changed to tomorrow"
        );
        break;
      }

      case "welcome": {
        if (!email) {
          return NextResponse.json(
            { error: "Email is required for welcome email" },
            { status: 400 }
          );
        }
        await sendWelcomeEmail({ email });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Email Test] Failed to send test email:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
