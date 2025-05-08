"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className = "" }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);
    const toastId = toast.loading("Signing out...");

    try {
      // Clear only Supabase-related storage
      const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Wait for session to be fully cleared
      await new Promise(resolve => setTimeout(resolve, 500));

      // Single session verification
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        throw new Error("Session not cleared");
      }

      toast.success("Successfully signed out!", { id: toastId });
      await router.replace('/');
    } catch (error) {
      console.error("Sign out error:", error);
      setError(error instanceof Error ? error.message : "Failed to sign out");
      toast.error(error instanceof Error ? error.message : "Failed to sign out", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={() => void handleSignOut()}
        className={`fantasy-button text-sm px-4 py-2 disabled:opacity-50 ${className}`}
        disabled={isLoading}
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}
