"use client";

import { useUser } from "@/hooks/useUser";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileButton } from "@/components/ProfileButton";
import SessionSearch from "@/components/SessionSearch";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return <p className="p-6 text-primary">Loading...</p>;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">RPG Marketplace</h1>
        {user ? (
          <div className="flex gap-2">
            <ProfileButton />
            <SignOutButton />
          </div>
        ) : (
          <Link href="/login" className="text-ink hover:text-ink-light">
            Log in
          </Link>
        )}
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
