"use client";

import { useEffect, useState } from "react";
import { Profile } from "../types";
import { supabase } from "@/lib/supabaseClient";

export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No access token available");
        }

        const response = await fetch(`/api/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch profile");
        console.error("[useProfile] Error:", error);
        setError(error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};
