"use client";

import { useState, useEffect, useCallback } from "react";
import CreateSessionForm from "./CreateSessionForm";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { Session as PrismaSession } from "@prisma/client";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GAME_OPTIONS = [
  "D&D 5e",
  "Pathfinder",
  "Call of Cthulhu",
  "Starfinder",
  "Shadowrun",
  "Cyberpunk Red",
  "Vampire: The Masquerade",
  "Other",
];

const GENRE_OPTIONS = [
  "Fantasy",
  "Horror",
  "Sci-Fi",
  "Modern",
  "Historical",
  "Post-Apocalyptic",
  "Superhero",
  "Other",
];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

interface Booking {
  userId: string;
  user: {
    email: string;
  };
}

interface WaitlistEntry {
  userId: string;
  user: {
    email: string;
  };
}

interface Tag {
  id: number;
  name: string;
}

interface Session extends Omit<PrismaSession, "imageUrl"> {
  dm: {
    name: string;
  };
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  tags: Tag[];
  imageUrl: string | null;
}

interface Filters {
  searchTerm: string;
  game: string;
  genre: string;
  experienceLevel: string;
  dateFrom: string;
  dateTo: string;
  tags: string[];
  type?: string;
  groupSize?: number;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface SessionSearchProps {
  initialFilters?: Partial<Filters>;
  skipAuthRedirect?: boolean;
}

export default function SessionSearch({ initialFilters = {}, skipAuthRedirect = false }: SessionSearchProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    game: "",
    genre: "",
    experienceLevel: initialFilters.experienceLevel || "",
    dateFrom: "",
    dateTo: "",
    tags: [],
    type: initialFilters.type || "",
    groupSize: initialFilters.groupSize,
  });
  const [joinedSessionIds, setJoinedSessionIds] = useState<number[]>([]);
  const [managingSession, setManagingSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const { profile } = useProfile(user?.id);
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && !skipAuthRedirect) {
        router.push("/login?redirect=/sessions");
        return;
      }

      const params = new URLSearchParams();
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
      if (filters.game) params.append("game", filters.game);
      if (filters.genre) params.append("genre", filters.genre);
      if (filters.experienceLevel) params.append("experienceLevel", filters.experienceLevel);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.tags.length > 0) params.append("tags", filters.tags.join(","));
      if (filters.type) params.append("type", filters.type);
      if (filters.groupSize) params.append("minSpots", filters.groupSize.toString());

      const response = await fetch(`/api/session/search?${params.toString()}`, {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch sessions");
      }

      let sessions = (await response.json()) as Session[];
      
      // Filter sessions based on group size if specified
      if (filters.groupSize) {
        sessions = sessions.filter(
          session => (session.maxParticipants - session.bookings.length) >= filters.groupSize!
        );
      }

      setSessions(sessions);
      setError(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to load sessions";
      console.error("Error fetching sessions:", error);
      setError(error);
      setSessions([]);
    }
  }, [filters, router, skipAuthRedirect]);

  const fetchJoinedSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(`/api/user-joined-sessions/${user.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch joined sessions");
      }

      const bookings = (await response.json()) as { session: { id: number } }[];
      setJoinedSessionIds(bookings.map((b) => b.session.id));
      setError(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to load joined sessions";
      console.error("Error fetching joined sessions:", error);
      setError(error);
      setJoinedSessionIds([]);
    }
  }, [user]);

  useEffect(() => {
    void fetchSessions();
    if (user) void fetchJoinedSessions();
  }, [filters, user, fetchSessions, fetchJoinedSessions]);

  const handleSessionCreated = async () => {
    setShowCreateForm(false);
    await fetchSessions();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(",").map((tag) => tag.trim());
    setFilters((prev) => ({ ...prev, tags }));
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(`/api/session/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = (await response.json()) as ApiResponse<null>;

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete session");
      }

      // Refresh the session list
      await fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert(error instanceof Error ? error.message : "Failed to delete session");
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  const joinSession = async (sessionId: number) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, userId: user.id }),
      });
      if (!res.ok) {
        throw new Error("Failed to join session");
      }
      setJoinedSessionIds((prev) => [...prev, sessionId]);
      await fetchSessions();
    } catch (error) {
      console.error("Error joining session:", error);
    }
  };

  const leaveSession = async (sessionId: number) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, userId: user.id }),
      });
      if (!res.ok) {
        throw new Error("Failed to leave session");
      }
      setJoinedSessionIds((prev) => prev.filter((id) => id !== sessionId));
      await fetchSessions();
    } catch (error) {
      console.error("Error leaving session:", error);
    }
  };

  const joinWaitlist = async (sessionId: number) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, userId: user.id }),
      });
      if (!res.ok) {
        throw new Error("Failed to join waitlist");
      }
      await fetchSessions();
    } catch (error) {
      console.error("Error joining waitlist:", error);
    }
  };

  const handleManageSession = (session: Session) => {
    setManagingSession(session);
  };

  const removeParticipant = async (sessionId: number, userId: string) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove participant");
      }

      // Refresh sessions and close management modal
      await fetchSessions();
      setManagingSession(null);
    } catch (error) {
      console.error("Error removing participant:", error);
      alert(error instanceof Error ? error.message : "Failed to remove participant");
    }
  };

  const removeFromWaitlist = async (sessionId: number, userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the waitlist?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from waitlist");
      }

      // Refresh sessions and close management modal
      await fetchSessions();
      setManagingSession(null);
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      alert(error instanceof Error ? error.message : "Failed to remove from waitlist");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Sessions</h2>
        {profile?.roles.includes("dm") && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            {showCreateForm ? "Cancel" : "Create New Session"}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
          <h3 className="text-lg font-semibold mb-4 text-primary">Create New Session</h3>
          <CreateSessionForm
            onCancel={() => setShowCreateForm(false)}
            onSuccess={() => void handleSessionCreated()}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <h3 className="text-lg font-semibold mb-4 text-primary">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary">Search</label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search sessions..."
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">Game</label>
            <select
              name="game"
              value={filters.game}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            >
              <option value="">All Games</option>
              {GAME_OPTIONS.map((game) => (
                <option key={game} value={game} className="text-primary">
                  {game}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">Genre</label>
            <select
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            >
              <option value="">All Genres</option>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre} className="text-primary">
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">Experience Level</label>
            <select
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            >
              <option value="">All Levels</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level} className="text-primary">
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-secondary">Tags</label>
            <input
              type="text"
              value={filters.tags.join(", ")}
              onChange={handleTagChange}
              placeholder="e.g. roleplay, combat, exploration"
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
            />
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
          >
            <div className="aspect-w-16 aspect-h-9">
              {session.imageUrl ? (
                <Image
                  src={session.imageUrl || "/placeholder.png"}
                  alt={session.title}
                  width={400}
                  height={400}
                  quality={100}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted">No image</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold text-primary mb-2">{session.title}</h3>
              <p className="text-secondary mb-4 line-clamp-2">{session.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted mb-4">
                <div>
                  <span className="font-medium">Game:</span> {session.game}
                </div>
                <div>
                  <span className="font-medium">Genre:</span> {session.genre}
                </div>
                <div>
                  <span className="font-medium">Level:</span> {session.experienceLevel}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(session.date).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {session.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="text-sm text-muted mb-2">
                {session.bookings.length} / {session.maxParticipants} participants
                {session.waitlist.length > 0 && (
                  <span className="ml-2 text-yellow-600">
                    ({session.waitlist.length} on waitlist)
                  </span>
                )}
              </div>
              {user?.id !== session.userId && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => router.push(`/session/${session.id}`)}
                    className="px-3 py-1 text-sm text-white hover:text-white"
                  >
                    View Details
                  </button>
                  {!joinedSessionIds.includes(session.id) &&
                    session.bookings.length >= session.maxParticipants && (
                      <button
                        onClick={() => void joinWaitlist(session.id)}
                        className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700"
                      >
                        Join Waitlist
                      </button>
                    )}
                  {joinedSessionIds.includes(session.id) && (
                    <button
                      onClick={() => void leaveSession(session.id)}
                      className="px-3 py-1 text-sm text-error hover:text-error"
                    >
                      Leave Session
                    </button>
                  )}
                </div>
              )}
              {user?.id === session.userId && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleManageSession(session)}
                    className="px-3 py-1 text-sm text-link hover:text-link-hover"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleEditSession(session)}
                    className="px-3 py-1 text-sm text-link hover:text-link-hover"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDeleteSession(session.id)}
                    className="px-3 py-1 text-sm text-error hover:text-error"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Session Management Modal */}
      {managingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">
                Manage Session: {managingSession.title}
              </h3>
              <button
                onClick={() => setManagingSession(null)}
                className="text-secondary hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Participants Section */}
              <div>
                <h4 className="text-md font-semibold mb-2">
                  Participants ({managingSession.bookings.length}/{managingSession.maxParticipants})
                </h4>
                <div className="space-y-2">
                  {managingSession.bookings.map((booking) => (
                    <div
                      key={booking.userId}
                      className="flex justify-between items-center p-2 bg-card rounded"
                    >
                      <span>{booking.user?.email}</span>
                      <button
                        onClick={() => void removeParticipant(managingSession.id, booking.userId)}
                        className="px-2 py-1 text-sm text-error hover:text-error"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waitlist Section */}
              {managingSession.waitlist.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-2">
                    Waitlist ({managingSession.waitlist.length})
                  </h4>
                  <div className="space-y-2">
                    {managingSession.waitlist.map((waitlist) => (
                      <div
                        key={waitlist.userId}
                        className="flex justify-between items-center p-2 bg-card rounded"
                      >
                        <span>{waitlist.user?.email}</span>
                        <button
                          onClick={() =>
                            void removeFromWaitlist(managingSession.id, waitlist.userId)
                          }
                          className="px-2 py-1 text-sm text-error hover:text-error"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">Edit Session</h3>
              <button
                onClick={() => setEditingSession(null)}
                className="text-secondary hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <CreateSessionForm
              session={editingSession}
              onCancel={() => setEditingSession(null)}
              onSuccess={() => {
                setEditingSession(null);
                void fetchSessions();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
