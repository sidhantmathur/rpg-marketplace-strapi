import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Sessions API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Sessions API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Sessions API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Sessions API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get the user's profile to check roles
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { roles: true },
    });

    if (!profile) {
      console.error("[Sessions API] Profile not found for user:", user.id);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // If user is a DM, fetch their sessions
    if (profile.roles.includes("dm")) {
      try {
        const sessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          },
          select: {
            id: true,
            date: true,
            duration: true,
          },
        });

        return NextResponse.json(sessions);
      } catch (dbError) {
        console.error("[Sessions API] Database error:", dbError);
        return NextResponse.json({ error: "Database error", details: "Failed to fetch sessions" }, { status: 500 });
      }
    }

    // If not a DM, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("[Sessions API] Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "An unexpected error occurred" 
    }, { status: 500 });
  }
}
