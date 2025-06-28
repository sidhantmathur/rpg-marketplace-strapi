import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Single Message API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Single Message API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Single Message API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Single Message API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { chatId, messageId } = await params;
    console.log("[Single Message API] Loading message:", messageId, "for chat:", chatId);

    // Verify user is a member of this chat
    const membership = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId: parseInt(chatId),
          userId: user.id,
        },
      },
    });

    if (!membership) {
      console.error("[Single Message API] User not a member of chat:", chatId);
      return NextResponse.json({ error: "Not authorized to access this chat" }, { status: 403 });
    }

    // Get message using Prisma
    const message = await prisma.message.findUnique({
      where: {
        id: parseInt(messageId),
        chatId: parseInt(chatId),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      console.error("[Single Message API] Message not found:", messageId);
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    console.log("[Single Message API] Found message:", message.id);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("[Single Message API] Error loading message:", error);
    return NextResponse.json(
      { error: "Failed to load message" },
      { status: 500 }
    );
  }
} 