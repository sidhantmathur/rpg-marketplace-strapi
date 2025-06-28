import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get("sortBy") || "rating";
    const search = searchParams.get("search") || "";

    // 1. Get all DMs
    const dms = await prisma.dungeonMaster.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      include: {
        sessions: {
          select: {
            id: true,
            title: true,
            date: true,
            maxParticipants: true,
            game: true,
            genre: true,
            experienceLevel: true,
            status: true,
            tags: {
              select: {
                name: true,
              },
            },
            bookings: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // 2. Get all profiles for these DMs
    const userIds = dms.map((dm) => dm.userId);
    const profiles = await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        roles: true,
      },
    });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

    // 3. Map profiles to DMs with enhanced information
    let formattedDms = dms.map((dm) => {
      const profile = profileMap[dm.userId];
      const sessions = dm.sessions;
      const activeSessions = sessions.filter(session => new Date(session.date) >= new Date());
      
      // Calculate session statistics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(session => session.status === "completed").length;
      const upcomingSessions = sessions.filter(session => session.status === "upcoming").length;
      
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

      return {
        id: dm.id,
        name: dm.name,
        userId: dm.userId,
        profile: profile ? {
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          ratingAvg: profile.ratingAvg,
          ratingCount: profile.ratingCount,
          memberSince: profile.createdAt,
          roles: profile.roles,
        } : null,
        sessionStats: {
          total: totalSessions,
          active: activeSessions.length,
          completed: completedSessions,
          upcoming: upcomingSessions,
        },
        preferences: {
          games: gamePreferences,
          genres: genrePreferences,
          experienceLevels: experienceLevels,
          tags: uniqueTags,
        },
        averageRating: profile?.ratingAvg ?? 0,
        ratingCount: profile?.ratingCount ?? 0,
        memberSince: profile?.createdAt ?? null,
      };
    });

    // 4. Sort if needed
    if (sortBy === "rating") {
      formattedDms = formattedDms.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === "sessions") {
      formattedDms = formattedDms.sort((a, b) => b.sessionStats.total - a.sessionStats.total);
    }

    return NextResponse.json(formattedDms);
  } catch (err) {
    console.error("[DMs API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch DMs" },
      { status: 500 }
    );
  }
} 