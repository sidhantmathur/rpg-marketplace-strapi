import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("[Create Direct Chat API] Starting request");
    
    const { targetUserId } = await req.json();
    console.log("[Create Direct Chat API] Target User ID:", targetUserId);
    
    if (!targetUserId) {
      console.error("[Create Direct Chat API] No target user ID provided");
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Create Direct Chat API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Create Direct Chat API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    console.log("[Create Direct Chat API] Verifying token...");
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Create Direct Chat API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Create Direct Chat API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("[Create Direct Chat API] User authenticated:", user.id);

    // Prevent users from creating chats with themselves
    if (user.id === targetUserId) {
      console.error("[Create Direct Chat API] User trying to chat with themselves");
      return NextResponse.json({ error: "Cannot create a chat with yourself" }, { status: 400 });
    }

    // Verify the target user exists and is a DM
    const targetProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
      select: { id: true, roles: true },
    });

    if (!targetProfile) {
      console.error("[Create Direct Chat API] Target user not found:", targetUserId);
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Only allow chats with DMs for now
    if (!targetProfile.roles.includes("dm")) {
      console.error("[Create Direct Chat API] Target user is not a DM:", targetUserId);
      return NextResponse.json({ error: "You can only start chats with Dungeon Masters" }, { status: 403 });
    }

    console.log("[Create Direct Chat API] Target user verified as DM:", targetUserId);

    // Check if a direct chat already exists between these users
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: "direct",
        members: {
          every: {
            userId: {
              in: [user.id, targetUserId],
            },
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (existingChat) {
      console.log("[Create Direct Chat API] Existing chat found:", existingChat.id);
      return NextResponse.json({ chat: existingChat });
    }

    // Create new direct chat using Prisma
    console.log("[Create Direct Chat API] Creating new direct chat...");
    const chat = await prisma.chat.create({
      data: {
        type: "direct",
      },
    });

    console.log("[Create Direct Chat API] Chat created:", chat.id);

    // Add both users as members
    await Promise.all([
      prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId: user.id,
        },
      }),
      prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId: targetUserId,
        },
      }),
    ]);

    console.log("[Create Direct Chat API] Chat members added");
    return NextResponse.json({ chat });
  } catch (error) {
    console.error("[Create Direct Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 