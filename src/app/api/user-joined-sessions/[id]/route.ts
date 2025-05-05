import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "@prisma/client";

function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[User Joined Sessions] Error:", err);
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
    console.warn("[User Joined Sessions] Fetching sessions for user:", id);

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        bookings: {
          some: {
            userId: id,
          },
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
        date: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch (err) {
    return handleError(err);
  }
}
