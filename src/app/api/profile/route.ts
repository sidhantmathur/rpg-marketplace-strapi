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

    console.log("[Profile API] Received profile creation request:", { id, email, roles });

    if (!id || !email || !roles || !Array.isArray(roles)) {
      console.error("[Profile API] Missing or invalid fields:", { id, email, roles });
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    console.log("[Profile API] Creating profile in database...");
    const profile = await prisma.profile.create({
      data: {
        id,
        email,
        roles,
      },
    });

    console.log("[Profile API] Profile created successfully:", profile);
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[Profile API] Error creating profile:", err);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
