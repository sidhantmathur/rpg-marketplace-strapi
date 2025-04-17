import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest, context: any) {
  // Type assertion inside the function for better type safety
  const id = context.params.id as string;
  
  const profile = await prisma.profile.findUnique({
    where: { id },
  });
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  
  return NextResponse.json(profile);
}