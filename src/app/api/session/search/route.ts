import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

// Define validation schema for search parameters
const searchParamsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  game: z.string().optional(),
  genre: z.string().optional(),
  experienceLevel: z.string().optional(),
  tags: z.string().optional(),
  searchTerm: z.string().optional(),
  dmId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Session Search] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Session Search] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase with timeout
    const authPromise = supabase.auth.getUser(token);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Auth verification timeout")), 5000)
    );

    const { data: { user }, error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;
    
    if (authError) {
      console.error("[Session Search] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Session Search] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    // Validate search parameters
    const validatedParams = searchParamsSchema.safeParse(searchParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validatedParams.error },
        { status: 400 }
      );
    }

    const { searchTerm, game, genre, experienceLevel, dateFrom, dateTo, tags, dmId } =
      validatedParams.data;

    const where: Prisma.SessionWhereInput = {
      status: "upcoming",
    };

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (game) where.game = game;
    if (genre) where.genre = genre;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (dmId) where.dmId = Number(dmId);
    if (tags) {
      const tagArray = tags.split(",");
      if (tagArray.length > 0) {
        where.tags = {
          some: {
            name: {
              in: tagArray,
            },
          },
        };
      }
    }

    // Add timeout to database query
    const dbPromise = prisma.session.findMany({
      where,
      include: {
        dm: true,
        bookings: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        waitlist: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        tags: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout")), 8000)
    );

    const sessions = await Promise.race([dbPromise, dbTimeoutPromise]) as any;

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[Session Search] Error:", error);
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json({ error: "Request timeout", details: error.message }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to search sessions" }, { status: 500 });
  }
}
