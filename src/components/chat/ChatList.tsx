"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { Chat } from "@/lib/chat";
import Image from "next/image";

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const router = useRouter();
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("[ChatList] Loading chats for user:", user.id);

        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No access token available");
        }

        // Use the API route instead of direct Supabase queries
        const response = await fetch("/api/chats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load chats");
        }

        const { chats: chatData } = await response.json();
        console.log("[ChatList] Found chats:", chatData);
        setChats(chatData);
      } catch (err) {
        console.error("[ChatList] Error loading chats:", err instanceof Error ? err.message : err);
        setError("Failed to load chats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to view chats</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No chats yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat)}
          className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
            selectedChatId === String(chat.id) ? "bg-gray-100" : ""
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              {chat.participants[0]?.avatarUrl ? (
                <Image
                  src={chat.participants[0].avatarUrl}
                  alt={chat.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {chat.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{chat.name}</div>
              <div className="text-sm text-gray-500">
                {chat.participants.length} participants
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 