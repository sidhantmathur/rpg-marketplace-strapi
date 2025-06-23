"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useChatCount } from "@/hooks/useChatCount";

interface ChatButtonProps {
  className?: string;
}

export function ChatButton({ className = "" }: ChatButtonProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { chatCount, loading: chatCountLoading } = useChatCount();

  console.log("[ChatButton] Render state:", { 
    user: !!user, 
    userLoading, 
    chatCount, 
    chatCountLoading 
  });

  const handleClick = () => {
    console.log("[ChatButton] Navigating to chat page");
    router.push("/chat");
  };

  if (userLoading || chatCountLoading) {
    console.log("[ChatButton] Showing loading state");
    return (
      <button
        disabled
        className={`flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-white cursor-not-allowed ${className}`}
      >
        <MessageCircle className="h-5 w-5" />
        <span>Loading...</span>
      </button>
    );
  }

  if (!user) {
    console.log("[ChatButton] No user, not rendering");
    return null;
  }

  console.log("[ChatButton] Rendering chat button with count:", chatCount);
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 relative ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      <span>Chats</span>
      {chatCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
          {chatCount > 99 ? "99+" : chatCount}
        </span>
      )}
    </button>
  );
} 