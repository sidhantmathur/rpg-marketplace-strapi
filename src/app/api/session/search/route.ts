import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define validation schema for search parameters
const searchParamsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  game: z.string().optional(),
  genre: z.string().optional(),
  experienceLevel: z.string().optional(),
  tags: z.string().optional(),
  searchTerm: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const searchTerm = searchParams.get("searchTerm");
    const game = searchParams.get("game");
    const genre = searchParams.get("genre");
    const experienceLevel = searchParams.get("experienceLevel");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const tags = searchParams.get("tags")?.split(",") || [];
    const dmId = searchParams.get("dmId");

    const where: any = {
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
    if (dateFrom) where.date = { ...where.date, gte: new Date(dateFrom) };
    if (dateTo) where.date = { ...where.date, lte: new Date(dateTo) };
    if (dmId) where.dmId = Number(dmId);
    if (tags.length > 0) {
      where.tags = {
        some: {
          name: {
            in: tags,
          },
        },
      };
    }

    const sessions = await prisma.session.findMany({
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

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error searching sessions:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
