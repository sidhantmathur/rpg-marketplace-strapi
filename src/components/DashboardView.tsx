"use client";

import { useEffect, useState, ChangeEvent, FormEvent, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import RatingBadge from "@/components/RatingBadge";
import ReviewModal from "@/components/ReviewModal";

type Review = {
  id: number;
  rating: number;
  comment?: string;
  authorId: string;
  author: { email: string };
  createdAt: string;
};

// Session type with optional fields
type Session = {
  id: number;
  title: string;
  date: string;
  description?: string;
  duration?: number;
  imageUrl?: string;
  userId: string;
  maxParticipants: number;
  dm: { name: string; userId: string; ratingAvg: number; ratingCount: number };
  bookings: { userId: string; user?: { email: string } }[];
  waitlist: { userId: string; user?: { email: string } }[];
  reviews?: Review[];
};

export default function Home() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useProfile();

  // DM state
  const [name, setName] = useState("");
  const [dms, setDms] = useState<{ id: number; name: string }[]>([]);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [joinedSessionIds, setJoinedSessionIds] = useState<number[]>([]);

  // NEW: review modal state
  const [activeReview, setActiveReview] = useState<Session | null>(null);

  // Create Session form state
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [selectedDm, setSelectedDm] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [sessionFile, setSessionFile] = useState<File | null>(null);
  const [sessionPreview, setSessionPreview] = useState<string | null>(null);

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/session/search");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json() as Session[];
      setSessions(data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  // Fetch all DMs
  const fetchDMs = async () => {
    try {
      const res = await fetch("/api/dm");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json() as { id: number; name: string }[];
      setDms(data);
    } catch (err) {
      console.error("Error fetching DMs:", err);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([fetchDMs(), fetchSessions()]);
      } catch (err) {
        console.error("Error in initial data fetch:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchJoinedSessions = async () => {
        try {
          const res = await fetch(`/api/user-joined-sessions/${user.id}`);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json() as { session: { id: number } }[];
          setJoinedSessionIds(data.map(booking => booking.session.id));
        } catch (err) {
          console.error("Error fetching joined sessions:", err);
        }
      };

      void fetchJoinedSessions();
    }
  }, [user]);

  // Add a new DM
  const handleDmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.id) return;
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId: user.id }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setName("");
      await fetchDMs();
    } catch (err) {
      console.error("Error creating DM:", err);
    }
  };

  // Handle image file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Max file size is 2 MB.");
      return;
    }
    setSessionFile(file);
    const previewUrl = URL.createObjectURL(file);
    setSessionPreview(previewUrl);
    // Clean up the object URL when component unmounts or file changes
    return () => URL.revokeObjectURL(previewUrl);
  };

  // Create a new session
  const handleSessionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionTitle || !sessionDate || !selectedDm) return;

    // 1) Create session without imageUrl
    const createRes = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: sessionTitle,
        date: sessionDate,
        dmId: selectedDm,
        userId: user?.id,
        description: sessionDescription,
        duration: parseInt(sessionDuration, 10),
        maxParticipants,
      }),
    });
    const { id: sessionId } = await createRes.json();

    // 2) Upload image if selected
    if (sessionFile) {
      const path = `${user.id}/session/${sessionId}/${Date.now()}-${sessionFile.name}`;

      const { data: uploadData, error } = await supabase.storage
        .from("sessions")
        .upload(path, sessionFile, { cacheControl: "3600", upsert: false });

      if (error) {
        console.error("Upload error:", error);
        alert("Image upload failed.");
      } else {
        // 3) Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("sessions").getPublicUrl(uploadData.path);

        // 4) Patch session record with imageUrl
        await fetch(`/api/session/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: publicUrl }),
        });
      }
    }

    // Reset form and refresh list
    setSessionTitle("");
    setSessionDate("");
    setSelectedDm("");
    setSessionDescription("");
    setSessionDuration("");
    setMaxParticipants(5);
    setSessionFile(null);
    setSessionPreview(null);
    fetchSessions();
    router.push("/");
  };

  // Handle session actions
  const handleJoinSession = useCallback(async (sessionId: number) => {
    await joinSession(sessionId);
  }, [joinSession]);

  const handleLeaveSession = useCallback(async (sessionId: number) => {
    await leaveSession(sessionId);
  }, [leaveSession]);

  const handleJoinWaitlist = useCallback(async (sessionId: number) => {
    await joinWaitlist(sessionId);
  }, [joinWaitlist]);

  const handleLeaveWaitlist = useCallback(async (sessionId: number) => {
    await leaveWaitlist(sessionId);
  }, [leaveWaitlist]);

  const handleDeleteSession = useCallback(async (sessionId: number) => {
    await deleteSession(sessionId);
  }, [deleteSession]);

  // Render functions
  const renderSessionActions = (session: Session) => {
    const isJoined = joinedSessionIds.includes(session.id);
    const isOnWaitlist = session.waitlist?.some(w => w.userId === user?.id) ?? false;
    const isFull = (session.bookings?.length ?? 0) >= session.maxParticipants;
    const isOwner = session.userId === user?.id;

    if (isOwner) {
      return (
        <button
          onClick={() => void handleDeleteSession(session.id)}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Delete Session
        </button>
      );
    }

    if (isJoined) {
      return (
        <button
          onClick={() => void handleLeaveSession(session.id)}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Leave Session
        </button>
      );
    }

    if (isOnWaitlist) {
      return (
        <button
          onClick={() => void handleLeaveWaitlist(session.id)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Leave Waitlist
        </button>
      );
    }

    if (isFull) {
      return (
        <button
          onClick={() => void handleJoinWaitlist(session.id)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Join Waitlist
        </button>
      );
    }

    return (
      <button
        onClick={() => void handleJoinSession(session.id)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Join Session
      </button>
    );
  };

  // Handle error display
  const handleError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unknown error occurred";
  };

  // Handle session status
  const getSessionStatus = (session: Session): { text: string; color: string } => {
    const isJoined = joinedSessionIds.includes(session.id);
    const isOnWaitlist = session.waitlist?.some(w => w.userId === user?.id) ?? false;
    const isFull = (session.bookings?.length ?? 0) >= session.maxParticipants;

    if (isJoined) {
      return { text: "✓ You've joined this session", color: "text-green-600" };
    }
    if (isOnWaitlist) {
      return { text: "✓ You're on the waitlist", color: "text-yellow-600" };
    }
    if (isFull) {
      return { text: "Session is full", color: "text-red-600" };
    }
    return { text: "", color: "" };
  };

  // Join a session
  const joinSession = async (sessionId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/session/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        throw new Error(`Failed to join session: ${res.status}`);
      }
      await Promise.all([fetchSessions(), fetchJoinedSessions()]);
    } catch (err) {
      console.error("Error joining session:", handleError(err));
    }
  };

  // Leave a session
  const leaveSession = async (sessionId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/session/${sessionId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        throw new Error(`Failed to leave session: ${res.status}`);
      }
      await Promise.all([fetchSessions(), fetchJoinedSessions()]);
    } catch (err) {
      console.error("Error leaving session:", handleError(err));
    }
  };

  // Join waitlist
  const joinWaitlist = async (sessionId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/session/${sessionId}/waitlist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        throw new Error(`Failed to join waitlist: ${res.status}`);
      }
      await fetchSessions();
    } catch (err) {
      console.error("Error joining waitlist:", handleError(err));
    }
  };

  // Leave waitlist
  const leaveWaitlist = async (sessionId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/session/${sessionId}/waitlist/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        throw new Error(`Failed to leave waitlist: ${res.status}`);
      }
      await fetchSessions();
    } catch (err) {
      console.error("Error leaving waitlist:", handleError(err));
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete session: ${res.status}`);
      }
      await fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", handleError(err));
    }
  };

  // Loading or not authenticated
  if (userLoading || profileLoading) return <p className="p-6">Loading...</p>;
  if (!user)
    return (
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>
        <p className="text-gray-700">
          Please log in to create or view sessions.
        </p>
      </main>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>
      {profile ? (
        <p className="text-sm text-gray-600 mb-4">
          You are logged in as: <strong>{profile.roles.join(", ")}</strong>
        </p>
      ) : (
        <p className="text-sm text-red-600 mb-4">
          Profile not found — try refreshing or contact support.
        </p>
      )}

      {/* DM Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Add a New DM</h2>
        <form onSubmit={(e) => void handleDmSubmit(e)} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter DM name"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add DM
          </button>
        </form>
      </div>

      {/* Session Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Create a New Session</h2>
        <form onSubmit={(e) => void handleSessionSubmit(e)} className="space-y-4">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session title"
            className="border p-2 rounded"
          />
          <textarea
            value={sessionDescription}
            onChange={(e) => setSessionDescription(e.target.value)}
            placeholder="Description (optional)"
            className="border p-2 rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          {sessionPreview && (
            <Image
              src={sessionPreview}
              alt="Preview"
              width={100}
              height={100}
              className="w-24 h-24 object-cover rounded"
            />
          )}
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            min={1}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            placeholder="Max participants"
            className="border p-2 rounded"
          />
          <input
            type="number"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(e.target.value)}
            placeholder="Duration in minutes"
            className="border p-2 rounded"
          />
          <select
            value={selectedDm}
            onChange={(e) => setSelectedDm(e.target.value)}
            className="border p-2 rounded bg-white text-black appearance-none"
          >
            <option value="">Select a DM</option>
            {dms.map((dm) => (
              <option key={dm.id} value={dm.id}>
                {dm.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Create Session
          </button>
        </form>
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => {
          const status = getSessionStatus(session);
          return (
            <div
              key={session.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={session.imageUrl || "/placeholder.png"}
                  alt={session.title}
                  width={400}
                  height={400}
                  quality={100}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{session.title}</h3>
              <p className="text-gray-600 mb-2">{session.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">DM:</span>
                <span>{session.dm.name}</span>
                <span className="text-yellow-500">
                  {"★".repeat(Math.round(session.dm.ratingAvg))}
                </span>
                <span className="text-gray-500">
                  ({session.dm.ratingCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Date:</span>
                <span>{new Date(session.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold">Players:</span>
                <span>
                  {session.bookings?.length ?? 0}/{session.maxParticipants}
                </span>
              </div>
              {status.text && (
                <div className={`mb-4 ${status.color}`}>{status.text}</div>
              )}
              {renderSessionActions(session)}
            </div>
          );
        })}
      </div>

      {/* My Joined Sessions */}
      {profile?.roles.includes("user") && joinedSessionIds.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold mb-2">My Joined Sessions</h2>
          <ul className="space-y-2">
            {sessions
              .filter((session) => joinedSessionIds.includes(session.id))
              .map((session) => (
                <li key={session.id} className="border p-2 rounded">
                  {session.imageUrl && (
                    <Image
                      src={session.imageUrl || "/placeholder.png"}
                      alt={session.title}
                      width={400}
                      height={400}
                      quality={100}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                  <div className="font-semibold">{session.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.date).toLocaleDateString()} — Hosted by{" "}
                    {session.dm.name}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {session.bookings.length} / {session.maxParticipants}{" "}
                    participants
                  </div>
                  {renderSessionActions(session)}
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Sessions You're Hosting */}
      {profile?.roles.includes("dm") && (
        <section className="mt-10">
          <h2 className="font-semibold mb-2">Sessions You're Hosting</h2>
          <ul className="space-y-2">
            {sessions
              .filter((session) => session.userId === user.id)
              .map((session) => (
                <li key={session.id} className="border p-2 rounded">
                  {session.imageUrl && (
                    <Image
                      src={session.imageUrl || "/placeholder.png"}
                      alt={session.title}
                      width={400}
                      height={400}
                      quality={100}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                  <div className="font-semibold">{session.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.date).toLocaleDateString()} — Hosted by
                    you
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {session.bookings.length} / {session.maxParticipants}{" "}
                    participants
                  </div>
                  {renderSessionActions(session)}
                </li>
              ))}
          </ul>
        </section>
      )}
      {activeReview && (
        <ReviewModal
          open={!!activeReview}
          onClose={() => setActiveReview(null)}
          sessionId={activeReview.id}
          targetId={activeReview.dm.userId}
          authorId={user.id}
          onSuccess={() => {
            fetchSessions(); // refresh list to show new rating
          }}
        />
      )}
    </div>
  );
}
