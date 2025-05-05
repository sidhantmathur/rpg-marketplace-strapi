"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Profile {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("[Profile Page] Params:", params);
  console.log("[Profile Page] ID:", id);

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
        const response = await fetch(`/api/profile/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
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
        }
      } catch (err) {
        console.error("[Profile Page] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-500">{error}</div>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-500">Profile not found</div>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          {profile.avatarUrl && (
            <div className="mr-4">
              <Image
                src={profile.avatarUrl}
                alt="Profile Avatar"
                width={100}
                height={100}
                className="rounded-full"
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold mb-2">{profile.email}</h2>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span>{profile.ratingAvg.toFixed(1)} ({profile.ratingCount} reviews)</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="font-semibold block mb-1">Roles:</label>
            <div className="flex gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Member Since:</label>
            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="font-semibold block mb-1">ID:</label>
            <p className="font-mono text-sm">{profile.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 