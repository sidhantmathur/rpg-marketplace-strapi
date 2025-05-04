// app/api/session/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sendSessionModification,
  sendSessionCancellation,
} from "@/utils/emailTemplates";

interface RouteParams {
  params: {
    id: string;
  };
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

interface SessionInfo {
  title: string;
  date: Date;
  id: number;
}

function handleError(err: unknown) {
  console.error("[Session] Uncaught error:", err);
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params;
    console.warn("[Session] Fetching session id:", id);
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session id" },
        { status: 400 },
      );
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

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session id" },
        { status: 400 },
      );
    }

    const body = await request.json() as SessionUpdateRequest;
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
        tags: tags ? {
          set: [],
          create: tags.map(tag => ({ name: tag }))
        } : undefined,
      },
    });

    // Notify all booked users about the changes
    if (session.bookings.length > 0) {
      const users = session.bookings.map((booking) => ({ email: booking.user.email }));
      const sessionInfo: SessionInfo = {
        title: updatedSession.title,
        date: updatedSession.date,
        id: updatedSession.id,
      };
      const changes = [
        title && `title changed to "${title}"`,
        date && `date changed to ${new Date(date).toLocaleString()}`,
        duration && `duration changed to ${duration} minutes`,
        maxParticipants && `max participants changed to ${maxParticipants}`,
      ].filter(Boolean).join(", ");
      
      await sendSessionModification(sessionInfo, users, changes);
    }

    return NextResponse.json(updatedSession);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session id" },
        { status: 400 },
      );
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

    // Delete all bookings first
    await prisma.booking.deleteMany({
      where: { sessionId },
    });

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    // Notify all booked users about the cancellation
    if (session.bookings.length > 0) {
      const users = session.bookings.map((booking) => ({ email: booking.user.email }));
      const sessionInfo: SessionInfo = {
        title: session.title,
        date: session.date,
        id: session.id,
      };
      await sendSessionCancellation(sessionInfo, users);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
