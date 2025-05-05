import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ProfileCreateRequest {
  id: string;
  email: string;
  roles: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProfileCreateRequest;
    const { id, email, roles } = body;

    console.warn("[Profile] Creating new profile:", { id, email, roles });

    if (!id || !email || !roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
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
    console.error("[Profile] Error creating profile:", err);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
