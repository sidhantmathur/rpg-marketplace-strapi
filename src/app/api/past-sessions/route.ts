import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Past Sessions API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Past Sessions API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Past Sessions API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Past Sessions API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get the user's profile to check roles
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { roles: true },
    });

    if (!profile) {
      console.error("[Past Sessions API] Profile not found for user:", user.id);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const now = new Date();

    // If user is a DM, fetch their past sessions
    if (profile.roles.includes("dm")) {
      try {
        const sessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            date: {
              lt: now,
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
      } catch (dbError) {
        console.error("[Past Sessions API] Database error:", dbError);
        return NextResponse.json({ error: "Database error", details: "Failed to fetch sessions" }, { status: 500 });
      }
    }

    // If not a DM, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("[Past Sessions API] Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "An unexpected error occurred" 
    }, { status: 500 });
  }
} 