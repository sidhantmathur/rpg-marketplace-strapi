import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

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

export async function GET(request: NextRequest) {
  try {
    // Parse and validate search parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = searchParamsSchema.parse(searchParams);

    // Build the where clause for Prisma
    const where: any = {
      status: 'upcoming', // Only show upcoming sessions by default
    };

    // Date range filter
    if (validatedParams.dateFrom || validatedParams.dateTo) {
      where.date = {};
      if (validatedParams.dateFrom) {
        where.date.gte = new Date(validatedParams.dateFrom);
      }
      if (validatedParams.dateTo) {
        where.date.lte = new Date(validatedParams.dateTo);
      }
    }

    // Game filter
    if (validatedParams.game) {
      where.game = validatedParams.game;
    }

    // Genre filter
    if (validatedParams.genre) {
      where.genre = validatedParams.genre;
    }

    // Experience level filter
    if (validatedParams.experienceLevel) {
      where.experienceLevel = validatedParams.experienceLevel;
    }

    // Tags filter
    if (validatedParams.tags) {
      const tags = validatedParams.tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: {
            in: tags,
          },
        },
      };
    }

    // Search term filter (searches in title and description)
    if (validatedParams.searchTerm) {
      where.OR = [
        { title: { contains: validatedParams.searchTerm, mode: 'insensitive' } },
        { description: { contains: validatedParams.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Execute the query
    const sessions = await prisma.session.findMany({
      where,
      orderBy: { date: 'asc' },
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
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Search error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 