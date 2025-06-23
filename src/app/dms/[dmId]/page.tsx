"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

interface DMProfile {
  id: string;
  email: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  roles: string[];
  description?: string | null;
  bio?: string | null;
  sessionStats?: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
  };
  preferences?: {
    games: Record<string, number>;
    genres: Record<string, number>;
    experienceLevels: Record<string, number>;
    tags: string[];
  };
}

interface DM {
  id: number;
  name: string;
  userId: string;
}

export default function DMProfilePage() {
  const router = useRouter();
  const params = useParams();
  const dmId = params?.dmId as string;
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [dmProfile, setDmProfile] = useState<DMProfile | null>(null);
  const [dm, setDm] = useState<DM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDMData = async () => {
      try {
        // Fetch DM profile
        const profileResponse = await fetch(`/api/profile/${dmId}`);
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch DM profile");
        }
        const profileData = await profileResponse.json();
        setDmProfile(profileData);

        // Fetch DM details
        const dmResponse = await fetch(`/api/dms`);
        if (!dmResponse.ok) {
          throw new Error("Failed to fetch DM details");
        }
        const dmsData = await dmResponse.json();
        const dmData = dmsData.find((d: any) => d.userId === dmId);
        setDm(dmData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (dmId) {
      void fetchDMData();
    }
  }, [dmId]);

  const handleStartChat = async () => {
    if (!user) {
      setError("You must be logged in to start a chat");
      return;
    }

    try {
      setIsLoading(true);
      
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
        body: JSON.stringify({ targetUserId: dmId }),
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
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
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

  if (!dmProfile || !dm) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-center">
          <p className="text-gray-600">DM not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* DM Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={dmProfile.avatarUrl || "/placeholder.png"}
                alt="DM Avatar"
                fill
                className="rounded-full object-cover border-2 border-amber"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{dm.name}</h1>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-amber">★</span>
                <span className="text-muted">
                  {dmProfile.ratingAvg.toFixed(1)} ({dmProfile.ratingCount} reviews)
                </span>
              </div>
              <p className="text-gray-600 mb-4">{dmProfile.email}</p>
              
              {/* Start Chat Button */}
              {user && user.id !== dmId && (
                <button
                  onClick={handleStartChat}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {isLoading ? "Starting chat..." : "Message DM"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DM Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              {dmProfile.description && (
                <div>
                  <h3 className="font-semibold text-primary">Description:</h3>
                  <p className="text-muted-foreground">{dmProfile.description}</p>
                </div>
              )}

              {dmProfile.bio && (
                <div>
                  <h3 className="font-semibold text-primary">Bio:</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{dmProfile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-primary">Roles:</h3>
                <div className="flex gap-2 mt-2">
                  {dmProfile.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-primary">Member Since:</h3>
                <p className="text-muted-foreground">
                  {new Date(dmProfile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Session Statistics */}
          {dmProfile.sessionStats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Session Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{dmProfile.sessionStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{dmProfile.sessionStats.active}</div>
                  <div className="text-sm text-muted-foreground">Active Sessions</div>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{dmProfile.sessionStats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{dmProfile.sessionStats.upcoming}</div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        {dmProfile.preferences && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Preferences & Expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(dmProfile.preferences.games).length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-2">Game Expertise:</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dmProfile.preferences.games).map(([game, count]) => (
                      <span
                        key={game}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {game} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(dmProfile.preferences.genres).length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-2">Preferred Genres:</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dmProfile.preferences.genres).map(([genre, count]) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {genre} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(dmProfile.preferences.experienceLevels).length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-2">Experience Levels:</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dmProfile.preferences.experienceLevels).map(([level, count]) => (
                      <span
                        key={level}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {level} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {dmProfile.preferences.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-primary mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {dmProfile.preferences.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 