"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SessionSearch from "@/components/SessionSearch";

function SessionsContent() {
  const searchParams = useSearchParams();
  const experience = searchParams.get("experienceLevel");
  const type = searchParams.get("type");
  const groupSize = searchParams.get("groupSize");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-8">Available Sessions</h1>
        <SessionSearch 
          initialFilters={{
            experienceLevel: experience || "",
            type: type || "",
            groupSize: groupSize ? parseInt(groupSize) : undefined
          }}
        />
      </div>
    </main>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionsContent />
    </Suspense>
  );
} 