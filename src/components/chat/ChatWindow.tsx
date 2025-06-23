import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ChatWindowProps {
  chatId: string;
  chatName?: string;
  avatarUrl?: string;
}

interface Message {
  id: number;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function ChatWindow({ chatId, chatName = "Chat", avatarUrl }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    getCurrentUser();

    // Load initial messages
    const loadMessages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No access token available");
        }

        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load messages");
        }

        const { messages: messageData } = await response.json();
        setMessages(messageData || []);
      } catch (err) {
        setError("Failed to load messages");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages using Supabase realtime
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `chatId=eq.${chatId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const handleSendMessage = async (message: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const { message: newMessage } = await response.json();
      setMessages((current) => [...current, newMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    }
  };

  if (loading) {
    return <div>Loading chat...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ height: "600px", position: "relative" }}>
      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Content>
              {avatarUrl && (
                <Avatar
                  src={avatarUrl}
                  name={chatName}
                  size="md"
                  style={{ marginRight: "10px" }}
                />
              )}
              {chatName}
            </ConversationHeader.Content>
          </ConversationHeader>
          <MessageList>
            {messages.map((message) => (
              <Message
                key={message.id}
                model={{
                  message: message.content,
                  sentTime: new Date(message.createdAt).toLocaleTimeString(),
                  sender: message.sender.email,
                  direction: message.sender.id === currentUserId ? "outgoing" : "incoming",
                  position: "single",
                }}
              />
            ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            onSend={handleSendMessage}
            attachButton={false}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
} 