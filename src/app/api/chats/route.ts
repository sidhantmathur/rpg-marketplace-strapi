import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

const createChatSchema = z.object({
  type: z.enum(["session", "direct"]),
  sessionId: z.number().optional(),
  memberIds: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Chats API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Chats API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Chats API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Chats API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createChatSchema.parse(body);

    // Create chat using Prisma
    const chat = await prisma.chat.create({
      data: {
        type: validatedData.type,
        sessionId: validatedData.sessionId,
      },
    });

    // Add members using Prisma
    await Promise.all(
      validatedData.memberIds.map((memberId) =>
        prisma.chatMember.create({
          data: {
            chatId: chat.id,
            userId: memberId,
          },
        })
      )
    );

    return NextResponse.json(chat);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[Chats API] Error creating chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Chats API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Chats API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Chats API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Chats API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("[Chats API] Loading chats for user:", user.id);

    // Get all chats where the user is a member using Prisma
    const chatMemberships = await prisma.chatMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        chat: {
          updatedAt: "desc",
        },
      },
    });

    // Transform the data to match the Chat interface
    const chats = chatMemberships.map((membership) => ({
      id: membership.chat.id,
      type: membership.chat.type,
      name: membership.chat.type === "session" 
        ? `Session Chat` 
        : membership.chat.members
            .filter((m) => m.userId !== user.id)
            .map((m) => m.user.email)
            .join(", "),
      participants: membership.chat.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      })),
      createdAt: membership.chat.createdAt,
      updatedAt: membership.chat.updatedAt,
    }));

    console.log("[Chats API] Found chats:", chats);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("[Chats API] Error loading chats:", error);
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 }
    );
  }
} 