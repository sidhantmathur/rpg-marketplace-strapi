"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChat = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const chatId = searchParams.get("chatId");
      const sessionId = searchParams.get("sessionId");

      console.log("[ChatPage] Loading chat with params:", { chatId, sessionId });

      if (chatId) {
        setSelectedChatId(chatId);
        setLoading(false);
        return;
      }

      if (sessionId) {
        try {
          console.log("[ChatPage] Creating/getting session chat for session:", sessionId);
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error("No access token available");
          }

          const response = await fetch("/api/chat/create-session-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create chat");
          }

          const { chat } = await response.json();
          console.log("[ChatPage] Chat created/found:", chat);
          setSelectedChatId(String(chat.id));
        } catch (err) {
          console.error("[ChatPage] Error creating/getting session chat:", err instanceof Error ? err.message : err);
          setError("Failed to load chat. You may not have permission to access this session.");
        }
      }
      setLoading(false);
    };

    void loadChat();
  }, [searchParams, user]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="h-[600px] flex items-center justify-center">
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="h-[600px] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <ChatList
            onSelectChat={(chat) => setSelectedChatId(String(chat.id))}
            selectedChatId={selectedChatId}
          />
        </div>
        <div className="col-span-9">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              chatName="Session Chat"
            />
          ) : (
            <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 