"use client";

import { useEffect, useState } from "react";
import { Profile } from "../types";

export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch profile"));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};
