"use client";

import { useUser } from "@/hooks/useUser";
import SessionSearch from "@/components/SessionSearch";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return <p className="p-6 text-primary">Loading...</p>;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Adarle 20</h1>
      </div>

      {user ? (
        <>
          <p className="mb-4 text-sm text-ink">Welcome, {user.email}</p>
          <SessionSearch />
        </>
      ) : (
        <div className="space-y-6">
          <p className="text-ink">
            Please{" "}
            <Link href="/login" className="text-ink hover:text-ink-light">
              log in
            </Link>{" "}
            to create or view sessions.
          </p>
          <div className="fantasy-border p-6 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">New to D&D?</h2>
            <p className="text-ink mb-4">
              Take our quick quiz to help us find the perfect session for you!
            </p>
            <Link
              href="/onboarding"
              className="fantasy-button inline-block px-6 py-2"
            >
              Start Your Adventure
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
