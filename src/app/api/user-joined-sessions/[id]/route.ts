import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    console.warn("[User Joined Sessions] Fetching sessions for user:", id);

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
    console.error("[User Joined Sessions] Error:", err);
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
