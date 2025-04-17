import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, roles } = body;

    console.log('🔧 Creating profile with:', { id, email, roles });

    if (!id || !email || !roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const profile = await prisma.profile.create({
      data: {
        id,
        email,
        roles,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error('❌ Error in POST /api/profile:', err);
    return NextResponse.json(
      { error: 'Failed to create profile', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}
