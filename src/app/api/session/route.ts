import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface SessionCreateRequest {
  title: string;
  description?: string;
  date: string;
  duration?: number;
  game?: string;
  genre?: string;
  experienceLevel?: string;
  maxParticipants?: number;
  tags?: string[];
  imageUrl?: string;
  userId: string;
}

interface SupabaseProfile {
  id: string;
  email: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SessionCreateRequest;
    const {
      title,
      description,
      date,
      duration,
      game,
      genre,
      experienceLevel,
      maxParticipants,
      tags,
      imageUrl,
      userId,
    } = body;

    if (!title || !date || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // First, get or create the DungeonMaster record
    let dm = await prisma.dungeonMaster.findFirst({
      where: { userId },
    });

    if (!dm) {
      // Get user profile to get the name
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single() as { data: SupabaseProfile | null };

      if (!profile) {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 },
        );
      }

      dm = await prisma.dungeonMaster.create({
        data: {
          name: profile.name || profile.email,
          userId,
        },
      });
    }

    const session = await prisma.session.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration,
        game,
        genre,
        experienceLevel,
        maxParticipants,
        imageUrl,
        dmId: dm.id,
        userId,
        tags: tags ? {
          create: tags.map(tag => ({ name: tag }))
        } : undefined,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const sessions = await prisma.session.findMany({
    include: {
      dm: true,
      bookings: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json() as { sessionId: number };

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 },
      );
    }

    const session = await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
