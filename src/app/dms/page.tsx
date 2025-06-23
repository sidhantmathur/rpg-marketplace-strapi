"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

interface DM {
  id: number;
  name: string;
  userId: string;
  profile: {
    id: string;
    email: string;
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    createdAt: string;
  };
  activeSessions: number;
  totalSessions: number;
  averageRating: number;
  ratingCount: number;
  memberSince: string;
}

export default function DMsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [dms, setDms] = useState<DM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "sessions">("rating");
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDMs = async () => {
      try {
        const response = await fetch(
          `/api/dms?sortBy=${sortBy}&search=${encodeURIComponent(search)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch DMs");
        }
        const data = await response.json();
        setDms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void fetchDMs();
  }, [search, sortBy]);

  const handleStartChat = async (dmUserId: string) => {
    if (!user) {
      setError("You must be logged in to start a chat");
      return;
    }

    try {
      setChatLoading(dmUserId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch("/api/chat/create-direct-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetUserId: dmUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create chat");
      }

      const { chat } = await response.json();
      router.push(`/chat?chatId=${chat.id}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      setError(error instanceof Error ? error.message : "Failed to start chat");
    } finally {
      setChatLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.refresh()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Dungeon Masters</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search DMs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "sessions")}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="rating">Sort by Rating</option>
              <option value="sessions">Sort by Sessions</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dms.map((dm) => (
            <div key={dm.id} className="card hover:shadow-lg transition-shadow">
              <Link href={`/profile/${dm.userId}`} className="block">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={dm.profile.avatarUrl || "/placeholder.png"}
                      alt="DM Avatar"
                      fill
                      className="rounded-full object-cover border-2 border-amber"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-primary truncate">{dm.name}</h2>
                    <div className="flex items-center gap-1">
                      <span className="text-amber">★</span>
                      <span className="text-muted">
                        {dm.averageRating.toFixed(1)} ({dm.ratingCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Active Sessions:</span>
                    <span className="text-primary font-semibold">{dm.activeSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Total Sessions:</span>
                    <span className="text-primary font-semibold">{dm.totalSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Member Since:</span>
                    <span className="text-primary font-semibold">
                      {new Date(dm.memberSince).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Start Chat Button */}
              {user && user.id !== dm.userId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleStartChat(dm.userId);
                    }}
                    disabled={chatLoading === dm.userId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {chatLoading === dm.userId ? "Starting chat..." : "Message DM"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {dms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No DMs found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
} 