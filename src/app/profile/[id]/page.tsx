"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import UpcomingSessions from "@/components/UpcomingSessions";
import PastSessions from "@/components/PastSessions";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [bio, setBio] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  console.log("[Profile Page] Params:", params);
  console.log("[Profile Page] ID:", id);

  useEffect(() => {
    async function checkCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsCurrentUser(user?.id === id);
    }
    void checkCurrentUser();
  }, [id]);

  useEffect(() => {
    if (!id) {
      console.error("[Profile Page] No ID available");
      setError("No profile ID provided");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchProfile() {
      console.log("[Profile Page] Starting fetch for id:", id);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[Profile Page] Session:", session);
        if (!session?.access_token) {
          throw new Error("No access token available");
        }

        const response = await fetch(`/api/profile/${id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        console.log("[Profile Page] Response status:", response.status);
        const data = await response.json();
        
        if (!response.ok) {
          console.error("[Profile Page] Error response:", data);
          throw new Error(data.error || "Failed to fetch profile");
        }
        
        console.log("[Profile Page] Received data:", data);
        if (isMounted) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        console.error("[Profile Page] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      setError("You must be logged in to start a chat");
      return;
    }

    try {
      setChatLoading(true);
      
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
        body: JSON.stringify({ targetUserId: id }),
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
      setChatLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(`/api/profile/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description, bio }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("[Profile Page] Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/profile/${id}/avatar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (err) {
      console.error("[Profile Page] Error uploading avatar:", err);
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 text-destructive">{error}</div>
        <Link href="/" className="text-primary hover:text-primary/90">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="mb-4 text-destructive">Profile not found</div>
        <Link href="/" className="text-primary hover:text-primary/90">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Profile</h1>
        <div className="flex gap-4">
          {/* Message DM Button - Show if viewing a DM's profile and not the current user */}
          {profile.roles.includes("dm") && user && user.id !== id && (
            <Button
              onClick={handleStartChat}
              disabled={chatLoading}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {chatLoading ? "Starting chat..." : "Message DM"}
            </Button>
          )}
          
          {isCurrentUser && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          )}
          <Link href="/" className="text-primary hover:text-primary/90">
            Back to Home
          </Link>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-md border border-border mb-8">
        <div className="flex items-center mb-6">
          <div className="mr-4 relative">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt="Profile Avatar"
                width={100}
                height={100}
                className="rounded-full"
              />
            ) : (
              <div className="w-[100px] h-[100px] bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl text-primary">
                  {profile?.email?.[0].toUpperCase()}
                </span>
              </div>
            )}
            {isCurrentUser && (
              <div className="absolute bottom-0 right-0">
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-primary">{profile?.email}</h2>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span className="text-muted-foreground">
                {profile?.ratingAvg.toFixed(1)} ({profile?.ratingCount} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="description" className="font-semibold block mb-1 text-primary">
                  Short Description:
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="A short description about yourself..."
                  maxLength={500}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="bio" className="font-semibold block mb-1 text-primary">
                  Bio:
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  placeholder="Tell us more about yourself..."
                  className="h-32"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              {profile?.description && (
                <div>
                  <Label className="font-semibold block mb-1 text-primary">Description:</Label>
                  <p className="text-muted-foreground">{profile.description}</p>
                </div>
              )}

              {profile?.bio && (
                <div>
                  <Label className="font-semibold block mb-1 text-primary">Bio:</Label>
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </>
          )}

          <div>
            <Label className="font-semibold block mb-1 text-primary">Roles:</Label>
            <div className="flex gap-2">
              {profile?.roles.map((role) => (
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
            <Label className="font-semibold block mb-1 text-primary">Member Since:</Label>
            <p className="text-muted-foreground">
              {new Date(profile?.createdAt || "").toLocaleDateString()}
            </p>
          </div>

          {profile?.roles.includes("dm") && profile.sessionStats && (
            <>
              <div>
                <Label className="font-semibold block mb-1 text-primary">Session Statistics:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profile.sessionStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profile.sessionStats.active}</div>
                    <div className="text-sm text-muted-foreground">Active Sessions</div>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profile.sessionStats.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profile.sessionStats.upcoming}</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                </div>
              </div>

              {profile.preferences && (
                <>
                  <div>
                    <Label className="font-semibold block mb-1 text-primary">Game Expertise:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(profile.preferences.games).map(([game, count]) => (
                        <span
                          key={game}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {game} ({count})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold block mb-1 text-primary">Preferred Genres:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(profile.preferences.genres).map(([genre, count]) => (
                        <span
                          key={genre}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {genre} ({count})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold block mb-1 text-primary">Experience Levels:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(profile.preferences.experienceLevels).map(([level, count]) => (
                        <span
                          key={level}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {level} ({count})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold block mb-1 text-primary">Tags:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.preferences.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <Label className="font-semibold block mb-1 text-primary">ID:</Label>
            <p className="font-mono text-sm text-muted-foreground">{profile?.id}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions Section */}
      <UpcomingSessions className="bg-card p-6 rounded-lg shadow-md border border-border mb-8" />

      {/* Past Sessions Section */}
      <PastSessions className="bg-card p-6 rounded-lg shadow-md border border-border" />
    </div>
  );
} 