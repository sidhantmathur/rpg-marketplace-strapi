import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "@prisma/client";

function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[Upcoming Sessions] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Session[] | { error: string }>> {
  try {
    const { id } = await params;
    console.warn("[Upcoming Sessions] Fetching sessions for user:", id);

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user's profile to check roles
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: { roles: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const now = new Date();

    // If user is a DM, fetch their hosted sessions
    if (profile.roles.includes("dm")) {
      const hostedSessions = await prisma.session.findMany({
        where: {
          dm: {
            userId: id,
          },
          date: {
            gte: now,
          },
        },
        include: {
          dm: true,
          bookings: {
            include: {
              user: true,
            },
          },
          reviews: {
            where: { deleted: false },
            orderBy: { createdAt: "desc" },
            include: { author: true },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return NextResponse.json(hostedSessions);
    }

    // If user is a regular user, fetch their joined sessions
    const joinedSessions = await prisma.session.findMany({
      where: {
        bookings: {
          some: {
            userId: id,
          },
        },
        date: {
          gte: now,
        },
      },
      include: {
        dm: true,
        bookings: {
          include: {
            user: true,
          },
        },
        reviews: {
          where: { deleted: false },
          orderBy: { createdAt: "desc" },
          include: { author: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(joinedSessions);
  } catch (err) {
    return handleError(err);
  }
} 