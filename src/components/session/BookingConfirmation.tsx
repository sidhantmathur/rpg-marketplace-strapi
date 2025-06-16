"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import type { Session as PrismaSession, Profile, DungeonMaster } from "@prisma/client";

interface SessionWithDetails extends PrismaSession {
  dm: DungeonMaster;
  bookings: Array<{
    user: {
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

interface BookingConfirmationProps {
  session: SessionWithDetails;
}

export default function BookingConfirmation({ session }: BookingConfirmationProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isJoining, setIsJoining] = useState(false);

  const handleConfirmBooking = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    setIsJoining(true);
    try {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (!supabaseSession?.access_token) {
        throw new Error("No access token available");
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseSession.access_token}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join session");
      }

      router.push(`/session/${session.id}`);
    } catch (error) {
      console.error("Error joining session:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const isFull = session.bookings.length >= session.maxParticipants;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Confirm Your Booking</h1>

        {/* Session Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Session Details</h2>
          
          {session.imageUrl && (
            <div className="relative w-full h-48 mb-4">
              <Image
                src={session.imageUrl}
                alt={session.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <span className="font-medium">Title:</span> {session.title}
            </div>
            <div>
              <span className="font-medium">Date:</span>{" "}
              {new Date(session.date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Time:</span>{" "}
              {new Date(session.date).toLocaleTimeString()}
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

        {/* DM Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Dungeon Master</h2>
          <div className="flex items-center space-x-4">
            <div>
              <div className="font-medium">{session.dm.name}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={isFull || isJoining}
            className={`px-6 py-2 rounded text-white ${
              isFull
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isJoining
              ? "Confirming..."
              : isFull
              ? "Session Full"
              : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
} 