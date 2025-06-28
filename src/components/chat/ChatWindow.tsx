import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

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
  sender?: {
    id: string;
    email: string;
    avatarUrl?: string;
  };
}

// Custom Message Component
function CustomMessage({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  // Handle cases where sender information might be missing (fallback from realtime)
  const sender = message.sender || { id: message.senderId, email: "Unknown User", avatarUrl: undefined };
  const displayName = sender.email ? sender.email.split('@')[0] : "Unknown User";
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[70%]`}>
        {/* Profile Picture */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {sender.avatarUrl ? (
            <Image
              src={sender.avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Message Content */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          <div className={`text-xs font-semibold text-gray-600 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {displayName}
          </div>
          
          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-lg max-w-full break-words ${
              isOwnMessage
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-200 text-gray-900 rounded-bl-md'
            }`}
          >
            {message.content}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ chatId, chatName = "Chat", avatarUrl }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    void getCurrentUser();

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
        console.log("[ChatWindow] Loaded messages:", messageData);
        setMessages(messageData || []);
      } catch (err) {
        setError("Failed to load messages");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void loadMessages();

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
        async (payload) => {
          // Fetch the complete message with sender information
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
              console.error("No access token available for realtime message");
              return;
            }

            const response = await fetch(`/api/chats/${chatId}/messages/${payload.new.id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (response.ok) {
              const { message } = await response.json();
              setMessages((current) => [...current, message]);
            } else {
              console.error("Failed to fetch complete message data");
              // Fallback to adding the raw message
              setMessages((current) => [...current, payload.new as Message]);
            }
          } catch (err) {
            console.error("Error fetching complete message data:", err);
            // Fallback to adding the raw message
            setMessages((current) => [...current, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

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
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const { message: sentMessage } = await response.json();
      setMessages((current) => [...current, sentMessage]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <p className="text-gray-500">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  console.log("[ChatWindow] Rendering with messages:", messages.length, "currentUserId:", currentUserId);

  return (
    <div className="h-[600px] flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          {avatarUrl && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <Image
                src={avatarUrl}
                alt={chatName}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">{chatName}</h2>
            <p className="text-sm text-gray-500">{messages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <CustomMessage
              key={message.id}
              message={message}
              isOwnMessage={message.sender?.id === currentUserId}
            />
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => void handleSendMessage()}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 