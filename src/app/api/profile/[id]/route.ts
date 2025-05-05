import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Profile } from "@/types";

// Helper to centralize 500 responses
function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[Profile API] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id } = context.params;
    console.warn("[Profile API] Starting request for ID:", id);

    if (!id) {
      console.error("[Profile API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    console.warn("[Profile API] Querying database...");
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
      console.warn("[Profile API] No profile found for id:", id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Format profile to match Profile type
    const formattedProfile: Profile = {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.createdAt.toISOString(), // Use createdAt as updatedAt since it's not in schema
      avatarUrl: profile.avatarUrl ?? undefined, // Convert null to undefined
    };

    console.warn("[Profile API] Found profile:", formattedProfile);
    return NextResponse.json(formattedProfile);
  } catch (err) {
    return handleError(err);
  }
}
