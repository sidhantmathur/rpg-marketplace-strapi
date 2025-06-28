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
    // Get the authorization header if it exists
    const authHeader = req.headers.get("Authorization");

    // If auth header exists, verify the user
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const validatedParams = searchParamsSchema.parse(searchParams);

    // Build the where clause for the query
    const where: Prisma.SessionWhereInput = {
      date: {
        gte: validatedParams.dateFrom ? new Date(validatedParams.dateFrom) : undefined,
        lte: validatedParams.dateTo ? new Date(validatedParams.dateTo) : undefined,
      },
      game: validatedParams.game || undefined,
      genre: validatedParams.genre || undefined,
      experienceLevel: validatedParams.experienceLevel || undefined,
      dmId: validatedParams.dmId ? Number(validatedParams.dmId) : undefined,
    };

    // Add text search if provided
    if (validatedParams.searchTerm) {
      where.OR = [
        { title: { contains: validatedParams.searchTerm, mode: "insensitive" } },
        { description: { contains: validatedParams.searchTerm, mode: "insensitive" } },
      ];
    }

    // Add tags filter if provided
    if (validatedParams.tags) {
      const tagNames = validatedParams.tags.split(",").map((tag) => tag.trim());
      where.tags = {
        some: {
          name: {
            in: tagNames,
          },
        },
      };
    }

    // Fetch sessions with related data
    const sessions = await prisma.session.findMany({
      where,
      include: {
        dm: {
          select: {
            name: true,
            userId: true,
          },
        },
        bookings: {
          select: {
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        waitlist: {
          select: {
            userId: true,
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

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[Session Search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search sessions" },
      { status: 500 }
    );
  }
}
