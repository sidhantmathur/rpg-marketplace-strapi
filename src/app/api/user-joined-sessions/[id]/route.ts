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
  { params }: { params: { id: string } }
): Promise<NextResponse<{ session: { id: number } }[] | { error: string }>> {
  try {
    const { id } = params;
    console.warn("[User Joined Sessions] Fetching sessions for user:", id);

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: id,
      },
      select: {
        session: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    return handleError(err);
  }
}
