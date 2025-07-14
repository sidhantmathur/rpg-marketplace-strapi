"use client";

import { useUser } from "@/hooks/useUser";
import SessionSearch from "@/components/SessionSearch";
import HeroBanner from "@/components/cms/HeroBanner";
import EventBanner from "@/components/cms/EventBanner";
import BlogPreview from "@/components/cms/BlogPreview";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return <p className="p-6 text-primary">Loading...</p>;

  return (
    <main className="max-w-7xl mx-auto">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Main Content */}
      <div className="px-6">
        {user ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-primary mb-2">Adarle 20</h1>
              <p className="text-sm text-ink">Welcome back, {user.email}</p>
            </div>
            <SessionSearch />
          </>
        ) : (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary mb-4">Adarle 20</h1>
            <p className="text-ink mb-6">
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

        {/* Event Banner */}
        <EventBanner />

        {/* Blog Preview */}
        <BlogPreview />
      </div>
    </main>
  );
}
