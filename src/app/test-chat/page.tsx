"use client";

import { useUser } from "@/hooks/useUser";
import { useChatCount } from "@/hooks/useChatCount";
import { ChatButton } from "@/components/ChatButton";

export default function TestChatPage() {
  const { user, loading } = useUser();
  const { chatCount, loading: chatCountLoading } = useChatCount();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chat Button Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">User State:</h2>
          <p>Loading: {loading ? "Yes" : "No"}</p>
          <p>User: {user ? "Logged in" : "Not logged in"}</p>
          <p>Email: {user?.email || "N/A"}</p>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Chat Count State:</h2>
          <p>Loading: {chatCountLoading ? "Yes" : "No"}</p>
          <p>Chat Count: {chatCount}</p>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Chat Button:</h2>
          <ChatButton />
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Actions:</h2>
          <a 
            href="/login" 
            className="text-blue-500 hover:underline mr-4"
          >
            Go to Login
          </a>
          <a 
            href="/chat" 
            className="text-blue-500 hover:underline"
          >
            Go to Chat Page
          </a>
        </div>
      </div>
    </div>
  );
} 