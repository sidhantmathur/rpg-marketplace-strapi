import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 },
        );
      }

      dm = await prisma.dungeonMaster.create({
        data: {
          name: profile.email.split("@")[0], // Use email username as default name
          userId,
        },
      });
    }

    // Create the session
    const newSession = await prisma.session.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        game,
        genre,
        experienceLevel,
        maxParticipants: parseInt(maxParticipants),
        imageUrl,
        userId,
        dmId: dm.id,
        status: "upcoming",
        tags: {
          create: tags.map((tag: string) => ({
            name: tag,
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: {
      dm: { select: { name: true } },
      bookings: {
        select: {
          userId: true,
          user: {
            select: { email: true },
          },
        },
      },
      waitlist: {
        select: {
          userId: true,
          user: {
            select: { email: true },
          },
        },
      },
    },
  });

  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    // Remove bookings first due to foreign key constraint
    await prisma.booking.deleteMany({
      where: { sessionId: Number(sessionId) },
    });
    await prisma.session.delete({
      where: { id: Number(sessionId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API DELETE /session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
