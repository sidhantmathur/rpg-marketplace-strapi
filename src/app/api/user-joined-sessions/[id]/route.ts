import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper to centralize 500 responses
function handleError(err: unknown) {
  console.error("[UserSessions] API error:", err);
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(_: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params;
    console.warn("[UserSessions] Fetching sessions for user:", id);

    // Optional: validate format of `id` here
    // e.g. if you expect a UUID: if (!isValidUUID(id)) { … }

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      include: {
        session: {
          include: {
            dm: true,
            bookings: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            waitlist: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    return handleError(err);
  }
}
