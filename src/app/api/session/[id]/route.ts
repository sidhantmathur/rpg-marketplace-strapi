// app/api/session/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSessionModification, sendSessionCancellation } from "@/utils/emailTemplates";

interface RouteParams {
  params: {
    id: string;
  };
}

interface SessionInfo {
  title: string;
  date: Date;
  id: number;
}

interface SessionUpdateRequest {
  title?: string;
  description?: string;
  date?: string;
  duration?: number;
  game?: string;
  genre?: string;
  experienceLevel?: string;
  maxParticipants?: number;
  tags?: string[];
  imageUrl?: string;
}

function handleError(err: unknown) {
  console.error("[Session] Uncaught error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    console.warn("[Session] Fetching session id:", id);
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        dm: true,
        bookings: { include: { user: true } },
        reviews: {
          where: { deleted: false },
          orderBy: { createdAt: "desc" },
          include: { author: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const body = (await request.json()) as SessionUpdateRequest;
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
      imageUrl,
    } = body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        dm: true,
        bookings: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        duration,
        game,
        genre,
        experienceLevel,
        maxParticipants,
        imageUrl,
        tags: tags
          ? {
              set: [],
              create: tags.map((tag: string) => ({ name: tag })),
            }
          : undefined,
      },
    });

    // Send email notifications to all participants
    const participants = session.bookings.map((booking) => ({
      email: booking.user.email,
    }));

    if (participants.length > 0) {
      const changes = [
        title && `title changed to "${title}"`,
        date && `date changed to ${new Date(date).toLocaleString()}`,
        duration && `duration changed to ${duration} minutes`,
        maxParticipants && `max participants changed to ${maxParticipants}`,
      ]
        .filter(Boolean)
        .join(", ");

      await sendSessionModification(
        {
          title: session.title,
          date: session.date,
          id: session.id,
        },
        participants,
        changes
      );
    }

    return NextResponse.json(updatedSession);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const deletedSession = await prisma.session.delete({
      where: { id: sessionId },
    });

    // Send cancellation emails to all participants
    const participants = session.bookings.map((booking) => ({
      email: booking.user.email,
    }));

    if (participants.length > 0) {
      await sendSessionCancellation(
        {
          title: session.title,
          date: session.date,
          id: session.id,
        },
        participants
      );
    }

    return NextResponse.json(deletedSession);
  } catch (err) {
    return handleError(err);
  }
}
