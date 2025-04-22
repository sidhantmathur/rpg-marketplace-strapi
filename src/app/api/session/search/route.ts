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
  tags: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
  dmId: z.string().optional(),
  availableOnly: z.string().optional(),
  sortBy: z.enum(['date', 'title', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
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
    if (validatedParams.tags && validatedParams.tags.length > 0) {
      where.tags = {
        some: {
          name: {
            in: validatedParams.tags,
          },
        },
      };
    }

    // DM filter
    if (validatedParams.dmId) {
      where.dmId = Number(validatedParams.dmId);
    }

    // Search term filter (searches in title and description)
    if (validatedParams.searchTerm) {
      where.OR = [
        { title: { contains: validatedParams.searchTerm, mode: 'insensitive' } },
        { description: { contains: validatedParams.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Available slots filter
    if (validatedParams.availableOnly === 'true') {
      where.bookings = {
        some: {
          NOT: {
            userId: {
              equals: where.userId,
            },
          },
        },
      };
    }

    // Build the orderBy clause
    const orderBy: any = {};
    if (validatedParams.sortBy) {
      orderBy[validatedParams.sortBy] = validatedParams.sortOrder || 'asc';
    } else {
      orderBy.date = 'asc'; // Default sorting
    }

    // Execute the query
    const sessions = await prisma.session.findMany({
      where,
      orderBy,
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