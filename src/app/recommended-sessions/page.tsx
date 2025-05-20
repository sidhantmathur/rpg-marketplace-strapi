"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import SessionSearch from "@/components/SessionSearch";
import Link from "next/link";

function RecommendedSessionsContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const experience = searchParams.get("experienceLevel");
  const type = searchParams.get("type");
  const groupSize = searchParams.get("groupSize");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-4">Recommended Sessions for You</h1>
        
        {!user ? (
          <div className="bg-card p-6 rounded-lg shadow-md border border-border mb-8">
            <h2 className="text-xl font-semibold mb-4">Create an Account to Book Sessions</h2>
            <p className="text-ink-light mb-4">
              Sign up to book these recommended sessions and start your D&D adventure!
            </p>
            <div className="flex gap-4">
              <Link 
                href={`/signup?redirect=/recommended-sessions?${searchParams.toString()}`}
                className="fantasy-button px-6 py-2"
              >
                Sign Up
              </Link>
              <Link 
                href={`/login?redirect=/recommended-sessions?${searchParams.toString()}`}
                className="text-ink hover:text-ink-light underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-ink-light mb-8">
            Based on your preferences, we've found these sessions that match your needs.
          </p>
        )}

        <SessionSearch 
          initialFilters={{
            experienceLevel: experience || "",
            type: type || "",
            groupSize: groupSize ? parseInt(groupSize) : undefined
          }}
          skipAuthRedirect={true}
        />
      </div>
    </main>
  );
}

export default function RecommendedSessionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecommendedSessionsContent />
    </Suspense>
  );
} 