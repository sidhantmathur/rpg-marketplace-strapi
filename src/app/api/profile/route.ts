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

    // Validate roles
    const validRoles = ["user", "dm"];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      console.error("[Profile API] Invalid roles:", invalidRoles);
      return NextResponse.json({ error: `Invalid roles: ${invalidRoles.join(", ")}` }, { status: 400 });
    }

    console.log("[Profile API] Creating profile in database...");
    
    // Use a transaction to ensure both profile and DM creation succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create the profile
      const profile = await tx.profile.create({
        data: {
          id,
          email,
          roles,
        },
      });

      // If user is a DM, create DungeonMaster entry
      if (roles.includes("dm")) {
        console.log("[Profile API] Creating DungeonMaster entry for user:", id);
        const dm = await tx.dungeonMaster.create({
          data: {
            userId: id,
            name: email.split("@")[0], // Use part of email as initial name
          },
        });
        console.log("[Profile API] DungeonMaster entry created:", dm);
      }

      return profile;
    });

    console.log("[Profile API] Profile created successfully:", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Profile API] Error creating profile:", err);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
