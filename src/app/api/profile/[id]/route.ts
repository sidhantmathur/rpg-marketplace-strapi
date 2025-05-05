import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to centralize 500 responses
function handleError(err: unknown): NextResponse {
  console.error("[Profile API] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = context.params;
    console.log("[Profile API] Starting request for ID:", id);

    if (!id) {
      console.error("[Profile API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    console.log("[Profile API] Querying database...");
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

    console.log("[Profile API] Found profile:", profile);
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[Profile API] Unexpected error:", err);
    return handleError(err);
  }
}
