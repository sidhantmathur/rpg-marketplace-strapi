import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import type { Message, Profile } from "@prisma/client";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Chat {
  id: number;
  type: "session" | "direct";
  name: string;
  participants: {
    id: string;
    email: string;
    avatarUrl?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  session?: {
    id: number;
    title: string;
    date: Date;
  };
}

export async function createSessionChat(sessionId: number, currentUserId?: string) {
  try {
    console.log("[Chat] Starting chat creation for session:", sessionId);
    
    // Get session details using Prisma
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        dm: true,
        bookings: true,
      },
    });

    if (!session) {
      console.error("[Chat] Session not found:", sessionId);
      throw new Error("Session not found");
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        sessionId: sessionId,
        type: "session",
      },
    });

    if (existingChat) {
      console.log("[Chat] Chat already exists for session:", sessionId);
      
      // If currentUserId is provided, ensure they are a member
      if (currentUserId) {
        const existingMember = await prisma.chatMember.findUnique({
          where: {
            chatId_userId: {
              chatId: existingChat.id,
              userId: currentUserId,
            },
          },
        });

        if (!existingMember) {
          console.log("[Chat] Adding current user to existing chat:", currentUserId);
          await prisma.chatMember.create({
            data: {
              chatId: existingChat.id,
              userId: currentUserId,
            },
          });
        }
      }
      
      return existingChat;
    }

    // Create chat using Prisma
    const chat = await prisma.chat.create({
      data: {
        type: "session",
        sessionId,
      },
    });

    console.log("[Chat] Created new chat:", chat.id);

    // Add all participants as members
    const memberIds = [
      session.dm.userId,
      ...session.bookings.map((booking) => booking.userId),
    ];

    // If currentUserId is provided and not already in the list, add them
    if (currentUserId && !memberIds.includes(currentUserId)) {
      memberIds.push(currentUserId);
    }

    // Create chat members using Prisma
    await Promise.all(
      memberIds.map((userId) =>
        prisma.chatMember.create({
          data: {
            chatId: chat.id,
            userId,
          },
        })
      )
    );

    console.log("[Chat] Added members to chat:", memberIds);
    return chat;
  } catch (error) {
    console.error("[Chat] Error creating session chat:", error);
    throw error;
  }
}

export async function createDirectChat(userId: string) {
  try {
    const { data: currentUser } = await supabaseClient.auth.getUser();
    if (!currentUser.user) throw new Error("Not authenticated");

    // Check if a direct chat already exists between these users using Prisma
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: "direct",
        members: {
          every: {
            userId: {
              in: [currentUser.user.id, userId],
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
      console.log("[Chat] Existing direct chat found:", existingChat.id);
      return existingChat;
    }

    // Create new chat using Prisma
    const chat = await prisma.chat.create({
      data: {
        type: "direct",
      },
    });

    console.log("[Chat] Created new direct chat:", chat.id);

    // Add both users as members using Prisma
    await Promise.all([
      prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId: currentUser.user.id,
        },
      }),
      prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId: userId,
        },
      }),
    ]);

    console.log("[Chat] Added members to direct chat:", [currentUser.user.id, userId]);
    return chat;
  } catch (error) {
    console.error("Error creating direct chat:", error);
    throw error;
  }
} 