"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import type { Session, Profile, DungeonMaster, Review } from "@prisma/client";

interface SessionWithDetails extends Session {
  dm: DungeonMaster & {
    userId: string;
  };
  bookings: Array<{
    userId: string;
    user: {
      email: string;
      avatarUrl: string | null;
    };
  }>;
  reviews: Array<Review & {
    author: {
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

interface SessionDetailsProps {
  session: SessionWithDetails;
}

export default function SessionDetails({ session }: SessionDetailsProps) {
  const router = useRouter();
  const { user } = useUser();

  const handleJoinSession = () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    // Navigate to booking confirmation page
    router.push(`/session/${session.id}/book`);
  };

  const isJoined = session.bookings.some((booking) => booking.user.email === user?.email);
  const isFull = session.bookings.length >= session.maxParticipants;

  // Format date consistently
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Format time consistently
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[1].slice(0, 5); // HH:mm format
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Session Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{session.title}</h1>
          {session.imageUrl && (
            <div className="relative w-full h-96 mb-4">
              <Image
                src={session.imageUrl}
                alt={session.title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Session Details</h2>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Date:</span>{" "}
                {formatDate(session.date)}
              </div>
              <div>
                <span className="font-medium">Time:</span>{" "}
                {formatTime(session.date)}
              </div>
              {session.duration && (
                <div>
                  <span className="font-medium">Duration:</span> {session.duration} minutes
                </div>
              )}
              <div>
                <span className="font-medium">Players:</span> {session.bookings.length}/
                {session.maxParticipants}
              </div>
              {session.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-2 text-gray-600">{session.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* DM Profile */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Dungeon Master</h2>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-lg">{session.dm.name}</div>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <div>{session.reviews.length} reviews</div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/profile/${session.dm.userId}`)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Go to DM Profile
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {session.bookings.map((booking) => (
              <Link
                key={booking.user.email}
                href={`/profile/${booking.userId}`}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                {booking.user.avatarUrl ? (
                  <Image
                    src={booking.user.avatarUrl}
                    alt="Participant"
                    width={32}
                    height={32}
                    className="rounded-full"
                    sizes="32px"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                    {booking.user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-sm">
                  {booking.user.email}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isJoined ? (
            <>
              <button
                onClick={() => router.push(`/profile/${user?.id}`)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                View in Profile
              </button>
              <button
                onClick={() => router.push(`/chat?sessionId=${session.id}`)}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Start Chat
              </button>
            </>
          ) : (
            <button
              onClick={handleJoinSession}
              disabled={isFull}
              className={`px-6 py-2 rounded text-white ${
                isFull
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isFull ? "Session Full" : "Book Session"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 