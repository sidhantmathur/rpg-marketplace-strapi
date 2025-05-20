"use client";

import { useSearchParams } from "next/navigation";
import SessionSearch from "@/components/SessionSearch";

export default function SessionsPage() {
  const searchParams = useSearchParams();
  
  // Get filter parameters from URL
  const experience = searchParams.get("experience");
  const type = searchParams.get("type");
  const groupSize = searchParams.get("groupSize");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-ink mb-8">Find Your Next Adventure</h1>
      <SessionSearch 
        initialFilters={{
          experienceLevel: experience || "",
          type: type || "",
          groupSize: groupSize ? parseInt(groupSize) : undefined
        }}
      />
    </main>
  );
} 