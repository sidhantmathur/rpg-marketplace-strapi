"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { AuthError } from "@supabase/supabase-js";

interface SignUpFormState {
  email: string;
  password: string;
  role: "player" | "dm";
  isLoading: boolean;
  error: string | null;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [formState, setFormState] = useState<SignUpFormState>({
    email: "",
    password: "",
    role: "player",
    isLoading: false,
    error: null,
  });

  // Redirect signed-in users away from signup page
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, error: null, isLoading: true }));

    try {
      // Validate form
      if (!formState.email || !formState.password) {
        throw new Error("Please fill in all required fields");
      }

      if (formState.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formState.email,
        password: formState.password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Failed to create user account");
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: signUpData.user.id,
          email: formState.email,
          roles: [formState.role],
        },
      ]);

      if (profileError) {
        throw new Error("Failed to create user profile");
      }

      router.push("/");
    } catch (error) {
      const message =
        error instanceof AuthError
          ? error.message
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred";
      setFormState((prev) => ({ ...prev, error: message }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={(e) => void handleSignUp(e)} className="space-y-4">
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
          minLength={6}
        />
        <div className="space-y-2">
          <label className="block font-medium">I want to sign up as:</label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="player"
                checked={formState.role === "player"}
                onChange={(e) => setFormState((prev) => ({ ...prev, role: "player" }))}
                className="form-radio"
              />
              <span>Player</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="dm"
                checked={formState.role === "dm"}
                onChange={(e) => setFormState((prev) => ({ ...prev, role: "dm" }))}
                className="form-radio"
              />
              <span>Dungeon Master</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          disabled={formState.isLoading}
        >
          {formState.isLoading ? "Creating account..." : "Sign Up"}
        </button>
        {formState.error && <p className="text-red-500 text-sm">{formState.error}</p>}
        <p className="text-sm mt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
