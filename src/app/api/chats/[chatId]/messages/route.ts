import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Messages API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Messages API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Messages API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Messages API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { chatId } = await params;
    console.log("[Messages API] Loading messages for chat:", chatId);

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
      console.error("[Messages API] User not a member of chat:", chatId);
      return NextResponse.json({ error: "Not authorized to access this chat" }, { status: 403 });
    }

    // Get messages using Prisma
    const messages = await prisma.message.findMany({
      where: {
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
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log("[Messages API] Found messages:", messages.length);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Messages API] Error loading messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Messages API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Messages API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Messages API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Messages API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { chatId } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    console.log("[Messages API] Sending message to chat:", chatId);

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
      console.error("[Messages API] User not a member of chat:", chatId);
      return NextResponse.json({ error: "Not authorized to send messages to this chat" }, { status: 403 });
    }

    // Create message using Prisma
    const message = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        content: content.trim(),
        senderId: user.id,
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

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: { updatedAt: new Date() },
    });

    console.log("[Messages API] Message created:", message.id);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[Messages API] Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 