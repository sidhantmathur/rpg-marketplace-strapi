"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

interface LoginFormState {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
    error: "",
    isLoading: false,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, error: "", isLoading: true }));
    const toastId = toast.loading("Signing in...");

    try {
      // Clear only Supabase-related storage
      const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
      supabaseKeys.forEach(key => localStorage.removeItem(key));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formState.email,
        password: formState.password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("No session created");
      }

      // Verify session persistence
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session not persisted");
      }

      toast.success("Successfully signed in!", { id: toastId });
      
      // Navigate to home page, replacing the current history entry
      await router.replace('/');
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An unexpected error occurred";
      setFormState((prev) => ({ ...prev, error: message }));
      toast.error(message, { id: toastId });
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-primary">Log In</h1>
      <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
        <input
          type="email"
          value={formState.email}
          onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="w-full border-2 border-ink-light rounded p-2 bg-parchment text-ink"
          required
          disabled={formState.isLoading}
        />
        <input
          type="password"
          value={formState.password}
          onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Password"
          className="w-full border-2 border-ink-light rounded p-2 bg-parchment text-ink"
          required
          disabled={formState.isLoading}
        />
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
          disabled={formState.isLoading}
        >
          {formState.isLoading ? "Logging in..." : "Log In"}
        </button>
        {formState.error && <p className="text-red-500 text-sm">{formState.error}</p>}
        <p className="text-sm mt-2">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
