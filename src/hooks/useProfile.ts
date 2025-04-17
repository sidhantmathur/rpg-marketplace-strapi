'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}
