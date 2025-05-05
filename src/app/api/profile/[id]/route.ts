import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Profile } from "@/types";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[Profile API] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    console.warn("[Profile API] Starting request for ID:", id);

    if (!id) {
      console.error("[Profile API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
        avatarUrl: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const formattedProfile: Profile = {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
    };

    return NextResponse.json(formattedProfile);
  } catch (err) {
    return handleError(err);
  }
}
