"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "../types";
import { PostgrestError } from "@supabase/supabase-js";

interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

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
        const { data, error: fetchError }: SupabaseResponse<Profile> = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError) throw fetchError;
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
