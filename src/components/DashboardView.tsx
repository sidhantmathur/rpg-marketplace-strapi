"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
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
  console.log("DashboardView component rendered");
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

  // Fetch DMs
  const fetchDMs = async () => {
    const res = await fetch("/api/dm");
    if (res.ok) {
      const data = await res.json();
      setDms(data);
    }
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    const res = await fetch("/api/session/search");
    if (res.ok) {
      const data: Session[] = await res.json();
      console.log("Fetched sessions:", data);
      setSessions(data);
    }
  };

  // Fetch sessions the user has joined
  const fetchJoinedSessions = async () => {
    if (!user) return;
    const res = await fetch(`/api/user-joined-sessions/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      console.log("Fetched joined sessions:", data);
      setJoinedSessionIds(data.map((b: any) => b.session.id));
    }
  };

  useEffect(() => {
    console.log("useEffect running, user:", user);
    fetchDMs();
    fetchSessions();
  }, []);

  useEffect(() => {
    console.log("useEffect for user running, user:", user);
    if (user) fetchJoinedSessions();
  }, [user]);

  // Add a new DM
  const handleDmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, userId: user?.id }),
    });
    if (res.ok) {
      setName("");
      fetchDMs();
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
    setSessionPreview(URL.createObjectURL(file));
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

  // Join a session
  const joinSession = async (sessionId: number) => {
    if (!user) return;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
    if (res.ok) {
      setJoinedSessionIds((prev) => [...prev, sessionId]);
      fetchSessions(); // Refresh sessions to update participant count
    }
  };

  // Leave a session
  const leaveSession = async (sessionId: number) => {
    if (!user) return;
    const res = await fetch("/api/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
    if (res.ok)
      setJoinedSessionIds((prev) => prev.filter((id) => id !== sessionId));
  };

  // Join waitlist
  const joinWaitlist = async (sessionId: number) => {
    if (!user) return;
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
    if (res.ok) {
      // Refresh sessions to update waitlist status
      fetchSessions();
    }
  };

  // Leave waitlist
  const leaveWaitlist = async (sessionId: number) => {
    if (!user) return;
    const res = await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
    if (res.ok) {
      // Refresh sessions to update waitlist status
      fetchSessions();
    }
  };

  // Delete a session (DM only)
  const deleteSession = async (sessionId: number) => {
    const res = await fetch("/api/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    else console.error("Failed to delete session");
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
    <main className="p-6 max-w-xl mx-auto">
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

      {/* Add Dungeon Master */}
      {profile?.roles.includes("dm") && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Add Dungeon Master</h2>
          <form onSubmit={handleDmSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter DM name"
              className="border p-2 rounded w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </form>
          <ul className="space-y-1">
            {dms.map((dm) => (
              <li key={dm.id} className="border p-2 rounded">
                {dm.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Create Session */}
      {profile?.roles.includes("dm") && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Create Session</h2>
          <form onSubmit={handleSessionSubmit} className="grid gap-2 mb-4">
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
              <img
                src={sessionPreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded"
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
        </section>
      )}

      {/* Available Sessions */}
      <section>
        <h2 className="font-semibold mb-2">Available Sessions</h2>
        <ul className="space-y-2">
          {sessions.map((session) => {
            const isFull = session.bookings.length >= session.maxParticipants;
            const hasJoined = joinedSessionIds.includes(session.id);
            const isOnWaitlist = session.waitlist.some(
              (w) => w.userId === user?.id,
            );
            const isHost = session.userId === user?.id;
            const isPlayer =
              profile?.roles.includes("user") || profile?.roles.includes("dm");
            const canBook = !hasJoined && !isFull && !isHost && !isOnWaitlist;
            const canJoinWaitlist =
              !hasJoined && isFull && !isHost && !isOnWaitlist;

            console.log("Session conditions:", {
              sessionId: session.id,
              isFull,
              hasJoined,
              isOnWaitlist,
              isHost,
              canBook,
              canJoinWaitlist,
              bookings: session.bookings,
              maxParticipants: session.maxParticipants,
              userId: user?.id,
              sessionUserId: session.userId,
            });

            return (
              <li key={session.id} className="border p-2 rounded">
                {session.imageUrl && (
                  <Image
                    src={session.imageUrl}
                    alt={session.title}
                    width={400}
                    height={200}
                    className="object-cover rounded mb-2"
                  />
                )}
                <div className="font-semibold">{session.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(session.date).toLocaleDateString()} — Hosted by{" "}
                  {session.dm.name}{" "}
                  <RatingBadge
                    avg={session.dm.ratingAvg}
                    count={session.dm.ratingCount}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {session.bookings.length} / {session.maxParticipants}{" "}
                  participants
                  {session.waitlist.length > 0 && (
                    <span className="ml-2 text-yellow-600">
                      ({session.waitlist.length} on waitlist)
                    </span>
                  )}
                </div>
                {canBook && (
                  <button
                    onClick={() => joinSession(session.id)}
                    className="mt-2 text-sm text-blue-600 underline"
                  >
                    Join Session
                  </button>
                )}

                {canJoinWaitlist && (
                  <button
                    onClick={() => joinWaitlist(session.id)}
                    className="mt-2 text-sm text-yellow-600 underline"
                  >
                    Join Waitlist
                  </button>
                )}

                {isOnWaitlist && (
                  <div className="mt-2">
                    <span className="text-sm text-yellow-600">
                      ✓ You're on the waitlist
                    </span>
                    <button
                      onClick={() => leaveWaitlist(session.id)}
                      className="ml-2 text-sm text-red-600 underline"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                )}

                {isPlayer && hasJoined && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ You've joined this session
                  </div>
                )}

                {isPlayer && !hasJoined && isFull && !isOnWaitlist && (
                  <div className="mt-2 text-sm text-red-600">
                    Session is full
                  </div>
                )}

                {/* ——— REVIEW SECTION ——— */}
                {isPlayer &&
                  hasJoined &&
                  new Date(session.date) < new Date() && (
                    <div className="mt-2">
                      {session.reviews?.some((r) => r.authorId === user.id) ? (
                        <p className="text-sm text-green-700">
                          ✓ Review submitted
                        </p>
                      ) : (
                        <button
                          onClick={() => setActiveReview(session)}
                          className="text-sm text-blue-600 underline"
                        >
                          Leave a review
                        </button>
                      )}
                    </div>
                  )}
              </li>
            );
          })}
        </ul>
      </section>

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
                      src={session.imageUrl}
                      alt={session.title}
                      width={400}
                      height={200}
                      className="object-cover rounded mb-2"
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
                  <button
                    onClick={() => leaveSession(session.id)}
                    className="mt-1 text-sm text-red-600 underline"
                  >
                    Leave Session
                  </button>
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
                      src={session.imageUrl}
                      alt={session.title}
                      width={400}
                      height={200}
                      className="object-cover rounded mb-2"
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
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this session?")
                      )
                        deleteSession(session.id);
                    }}
                    className="mt-1 text-sm text-red-600 underline"
                  >
                    Delete Session
                  </button>
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
    </main>
  );
}
