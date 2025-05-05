"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
          error: fetchError,
        } = await supabase.auth.getUser();
        if (fetchError) throw fetchError;
        setUser(authUser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};
