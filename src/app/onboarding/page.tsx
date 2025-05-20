"use client";

import { OnboardingQuiz } from "@/components/OnboardingQuiz";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-ink mb-8 text-center">
          Welcome to Your D&D Adventure
        </h1>
        <OnboardingQuiz />
      </div>
    </main>
  );
} 