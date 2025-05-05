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
          <Link href="/login" className="text-link hover:text-link-hover">
            Log in
          </Link>
        )}
      </div>

      {user ? (
        <>
          <p className="mb-4 text-sm text-secondary">Welcome, {user.email}</p>
          <SessionSearch />
        </>
      ) : (
        <p className="text-secondary">
          Please{" "}
          <Link href="/login" className="text-link hover:text-link-hover">
            log in
          </Link>{" "}
          to create or view sessions.
        </p>
      )}
    </main>
  );
}
