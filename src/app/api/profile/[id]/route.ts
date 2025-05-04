import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper to centralize 500 responses
function handleError(err: unknown) {
  console.error("🔥 [api/profile/[id]] error:", err);
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(_: NextRequest, context: any) {
  try {
    const rawId = context.params.id as string;
    console.log("🛰 GET /api/profile/[id] → id=", rawId);

    const profile = await prisma.profile.findUnique({
      where: { id: rawId },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    return handleError(err);
  }
}
