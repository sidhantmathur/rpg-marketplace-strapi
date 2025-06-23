import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  userId: string;
}

interface ChatMember {
  userId: string;
}

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
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error("Not authenticated");

    // Check if chat already exists
    const { data: existingChats, error: existingError } = await supabase
      .from("Chat")
      .select(`
        *,
        members:ChatMember(
          userId
        )
      `)
      .eq("type", "direct")
      .eq("members.userId", currentUser.user.id);

    if (existingError) throw existingError;

    // Check if there's already a direct chat between these users
    const existingChat = existingChats?.find((chat) =>
      chat.members.some((member: ChatMember) => member.userId === userId)
    );

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from("Chat")
      .insert({
        type: "direct",
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Add both users as members
    const memberPromises = [currentUser.user.id, userId].map((memberId) =>
      supabase.from("ChatMember").insert({
        chatId: chat.id,
        userId: memberId,
      })
    );

    await Promise.all(memberPromises);

    return chat;
  } catch (error) {
    console.error("Error creating direct chat:", error);
    throw error;
  }
} 