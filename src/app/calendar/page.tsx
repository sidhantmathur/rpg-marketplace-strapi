"use client";

import { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Session {
  id: number;
  title: string;
  description: string;
  date: string;
  duration: number;
  game: string;
  genre: string;
  maxParticipants: number;
  imageUrl?: string | null;
  dm: {
    name: string;
    userId: string;
  };
  bookings: Array<{
    userId: string;
    user: {
      email: string;
    };
  }>;
  tags?: Array<{
    name: string;
  }>;
  type: "hosted" | "joined";
}

export default function CalendarPage() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.id) return;

    async function fetchSessions() {
      if (!user || !user.id) return;
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("No access token available");
        const [hostedResponse, joinedResponse] = await Promise.all([
          fetch("/api/sessions", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch("/api/past-sessions", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);
        if (!hostedResponse.ok || !joinedResponse.ok) throw new Error("Failed to fetch sessions");
        const hostedData = await hostedResponse.json();
        const joinedData = await joinedResponse.json();
        console.log("[Calendar] Joined Data:", joinedData);
        const hostedSessions: Session[] = [
          ...(hostedData.upcoming || []),
          ...(hostedData.past || [])
        ].map((session: any) => ({ ...session, type: "hosted" as const }));
        const joinedSessions: Session[] = [
          ...(joinedData.upcoming || []),
          ...(joinedData.past || []),
          ...(Array.isArray(joinedData) ? joinedData : []) // fallback for array response
        ].map((session: any) => ({ ...session, type: "joined" as const }));
        const allSessions = [...hostedSessions];
        joinedSessions.forEach(joinedSession => {
          const isDuplicate = allSessions.some(hostedSession => hostedSession.id === joinedSession.id);
          if (!isDuplicate) allSessions.push(joinedSession);
        });
        setSessions(allSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchSessions();
  }, [user]);

  // Map sessions to FullCalendar events
  const events = useMemo(() =>
    sessions.map((session) => ({
      id: String(session.id),
      title: session.title,
      start: session.date,
      end: session.date, // For now, just use start; can add duration if needed
      backgroundColor: session.type === "hosted" ? "#2563eb" : "#f59e42",
      borderColor: session.type === "hosted" ? "#2563eb" : "#f59e42",
      textColor: "#fff",
      extendedProps: { session },
    })),
    [sessions]
  );

  if (!user) {
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">My Game Calendar</h1>
        <Link href="/" className="text-primary hover:text-primary/90">
          Back to Home
        </Link>
      </div>
      <div className="bg-card p-4 rounded-lg border border-border shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek"
          }}
          events={events}
          height="auto"
          eventClick={(info) => {
            const session = info.event.extendedProps.session as Session;
            if (session) {
              window.location.href = `/session/${session.id}`;
            }
          }}
          eventDisplay="block"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }}
          dayHeaderFormat={{
            weekday: 'long'
          }}
          titleFormat={{
            year: 'numeric',
            month: 'long'
          }}
        />
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#2563eb" }}></span>
            <span>Hosted Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#f59e42" }}></span>
            <span>Joined Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
} 