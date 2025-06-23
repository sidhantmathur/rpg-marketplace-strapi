import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

export function useChatCount() {
  const { user } = useUser();
  const [chatCount, setChatCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatCount = async () => {
      if (!user) {
        setChatCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setChatCount(0);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/chats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const { chats } = await response.json();
          setChatCount(chats?.length || 0);
        } else {
          setChatCount(0);
        }
      } catch (error) {
        console.error("[useChatCount] Error loading chat count:", error);
        setChatCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadChatCount();
  }, [user]);

  return { chatCount, loading };
} 