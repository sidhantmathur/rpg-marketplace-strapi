import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Profile, ProfileWithDate } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Set a reasonable timeout for the request
export const maxDuration = 30; // 30 seconds

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
    console.log("[Profile API] Starting request for ID:", id);

    if (!id) {
      console.error("[Profile API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Add timeout to the database query
    const profile = await Promise.race<ProfileWithDate | null>([
      prisma.profile.findUnique({
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
      }) as Promise<ProfileWithDate | null>,
      new Promise<ProfileWithDate | null>((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 25000)
      )
    ]);

    if (!profile) {
      console.error("[Profile API] Profile not found for ID:", id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If the user is a DM, fetch additional DM-specific information
    if (profile.roles.includes("dm")) {
      const sessions = await prisma.session.findMany({
        where: { userId: id },
        select: {
          id: true,
          date: true,
          status: true,
          game: true,
          genre: true,
          experienceLevel: true,
          tags: {
            select: {
              name: true,
            },
          },
        },
      });

      const activeSessions = sessions.filter(session => new Date(session.date) >= new Date());
      const completedSessions = sessions.filter(session => session.status === "completed");
      const upcomingSessions = sessions.filter(session => session.status === "upcoming");

      // Calculate game preferences
      const gamePreferences = sessions.reduce((acc, session) => {
        if (session.game) {
          acc[session.game] = (acc[session.game] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate genre preferences
      const genrePreferences = sessions.reduce((acc, session) => {
        if (session.genre) {
          acc[session.genre] = (acc[session.genre] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate experience level preferences
      const experienceLevels = sessions.reduce((acc, session) => {
        if (session.experienceLevel) {
          acc[session.experienceLevel] = (acc[session.experienceLevel] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get unique tags
      const uniqueTags = Array.from(new Set(sessions.flatMap(session => 
        session.tags.map(tag => tag.name)
      )));

      const formattedProfile: Profile = {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        sessionStats: {
          total: sessions.length,
          active: activeSessions.length,
          completed: completedSessions.length,
          upcoming: upcomingSessions.length,
        },
        preferences: {
          games: gamePreferences,
          genres: genrePreferences,
          experienceLevels: experienceLevels,
          tags: uniqueTags,
        },
      };

      return NextResponse.json(formattedProfile);
    }

    const formattedProfile: Profile = {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
    };

    return NextResponse.json(formattedProfile);
  } catch (err) {
    if (err instanceof Error && err.message === "Database query timeout") {
      console.error("[Profile API] Database query timed out");
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return handleError(err);
  }
}

export async function PATCH(
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
    if (!id) {
      console.error("[Profile API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Verify the user is updating their own profile
    if (user.id !== id) {
      console.error("[Profile API] User not authorized to update this profile");
      return NextResponse.json({ error: "Not authorized to update this profile" }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Profile API] Update request body:", body);
    const { description, bio } = body;

    // Validate input
    if (description && description.length > 500) {
      return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
    }

    // First, get the current profile to ensure it exists
    const currentProfile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
        avatarUrl: true,
        ratingAvg: true,
        ratingCount: true,
        description: true,
        bio: true,
      },
    });

    if (!currentProfile) {
      console.error("[Profile API] Profile not found for update");
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log("[Profile API] Current profile:", currentProfile);

    // Update the profile using upsert to handle both create and update cases
    const updatedProfile = await prisma.profile.upsert({
      where: { id },
      create: {
        id,
        email: currentProfile.email,
        roles: currentProfile.roles,
        description: description || null,
        bio: bio || null,
      },
      update: {
        description: description || null,
        bio: bio || null,
      },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
        avatarUrl: true,
        ratingAvg: true,
        ratingCount: true,
        description: true,
        bio: true,
      },
    });

    console.log("[Profile API] Updated profile:", updatedProfile);
    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[Profile API] Error in PATCH:", err);
    return handleError(err);
  }
}
