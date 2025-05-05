import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Profile } from "@/types";
import { supabase } from "@/lib/supabaseClient";

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
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Profile API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Profile API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Profile API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Profile API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

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
