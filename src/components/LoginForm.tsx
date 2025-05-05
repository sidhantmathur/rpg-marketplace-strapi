"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthError } from "@supabase/supabase-js";

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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formState.email,
        password: formState.password,
      });

      if (error) {
        throw error;
      }

      router.push("/");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An unexpected error occurred";
      setFormState((prev) => ({ ...prev, error: message }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Log In</h1>
      <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
        <input
          type="email"
          value={formState.email}
          onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          value={formState.password}
          onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Password"
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
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
