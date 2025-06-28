import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import type { Session } from "@prisma/client";

interface SessionWithRelations extends Session {
  dm: {
    id: number;
    name: string;
    createdAt: Date;
    userId: string;
  };
  bookings: Array<{
    id: number;
    createdAt: Date;
    userId: string;
    sessionId: number;
    user: {
      id: string;
      email: string;
    };
  }>;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string | null;
    createdAt: Date;
    authorId: string;
    sessionId: number;
    deleted: boolean;
    author: {
      id: string;
      email: string;
    };
  }>;
}

interface UpcomingSessionsProps {
  className?: string;
}

export default function UpcomingSessions({ className = "" }: UpcomingSessionsProps) {
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/upcoming-sessions/${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch sessions");
        }

        setSessions(data);
      } catch (err) {
        console.error("[UpcomingSessions] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSessions();
  }, [user]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        <p className="text-gray-500">No upcoming sessions found.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
          >
            {session.imageUrl ? (
              <div className="relative h-48 w-full">
                <Image
                  src={session.imageUrl}
                  alt={session.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            ) : (
              <div className="h-48 w-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary">No image</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(session.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {new Date(session.date).toLocaleTimeString()}
                </p>
                <p>
                  <span className="font-medium">Host:</span> {session.dm.name}
                </p>
                <p>
                  <span className="font-medium">Players:</span>{" "}
                  {session.bookings.length}/{session.maxParticipants}
                </p>
                {session.description && (
                  <p className="mt-2 line-clamp-2">{session.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 