"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createDirectChat } from "@/lib/chat";
import { createClient } from "@supabase/supabase-js";
import { MessageCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DMProfilePage() {
  const router = useRouter();
  const params = useParams();
  const dmId = params?.dmId as string;
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    try {
      setIsLoading(true);
      const chat = await createDirectChat(dmId);
      router.push(`/chat?chatId=${chat.id}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Existing DM profile content */}
      
      <button
        onClick={handleStartChat}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <MessageCircle className="w-5 h-5" />
        {isLoading ? "Starting chat..." : "Message DM"}
      </button>
    </div>
  );
} 