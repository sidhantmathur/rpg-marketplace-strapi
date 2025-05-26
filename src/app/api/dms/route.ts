import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

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
      },
    });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

    // 3. Map profiles to DMs
    let formattedDms = dms.map((dm) => ({
      id: dm.id,
      name: dm.name,
      userId: dm.userId,
      profile: profileMap[dm.userId] || null,
      activeSessions: dm.sessions.filter(session => new Date(session.date) >= new Date()).length,
      totalSessions: dm.sessions.length,
      averageRating: profileMap[dm.userId]?.ratingAvg ?? 0,
      ratingCount: profileMap[dm.userId]?.ratingCount ?? 0,
      memberSince: profileMap[dm.userId]?.createdAt ?? null,
    }));

    // 4. Sort if needed
    if (sortBy === "rating") {
      formattedDms = formattedDms.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === "sessions") {
      formattedDms = formattedDms.sort((a, b) => b.totalSessions - a.totalSessions);
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