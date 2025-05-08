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

// Add password validation
const validatePassword = (password: string): string | null => {
  const minLength = 6;
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }

  // Future password requirements - commented out for now
  /*
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase) {
    return "Password must contain at least one uppercase letter";
  }
  if (!hasLowerCase) {
    return "Password must contain at least one lowercase letter";
  }
  if (!hasNumbers) {
    return "Password must contain at least one number";
  }
  if (!hasSpecialChar) {
    return "Password must contain at least one special character";
  }
  */

  return null;
};

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
      // Validate password
      const passwordError = validatePassword(formState.password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Clear only Supabase-related storage
      const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
      supabaseKeys.forEach(key => localStorage.removeItem(key));

      // Add retry logic for sign in
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formState.email,
            password: formState.password,
          });

          if (error) throw error;
          if (!data.session) throw new Error("No session created");

          // Wait for session to be fully established
          await new Promise(resolve => setTimeout(resolve, 500));

          // Single session verification
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Session not persisted");
          }

          toast.success("Successfully signed in!", { id: toastId });
          await router.replace('/');
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error");
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
          }
        }
      }

      throw lastError || new Error("Failed to sign in after multiple attempts");
    } catch (error) {
      console.error("Sign in error:", error);
      setFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to sign in",
        isLoading: false,
      }));
      toast.error(error instanceof Error ? error.message : "Failed to sign in", { id: toastId });
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
