"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { ProfileButton } from "@/components/ProfileButton";
import { SignOutButton } from "@/components/SignOutButton";
import { ChatButton } from "@/components/ChatButton";
import ThemeToggle from "@/components/ThemeToggle";

export function Navbar() {
  const { user, loading } = useUser();

  console.log("[Navbar] Render state:", { 
    user: !!user, 
    loading,
    userEmail: user?.email 
  });

  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            Adarle 20
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-ink hover:text-ink-light font-bold"
              >
                Home
              </Link>
              <Link 
                href="/dms" 
                className="text-ink hover:text-ink-light font-bold"
              >
                Browse DMs
              </Link>
              {user && (
                <ChatButton />
              )}
            </nav>
            <div className="flex items-center gap-2">
              {!loading && user && (
                <>
                  <ProfileButton />
                  <SignOutButton />
                </>
              )}
              {!loading && !user && (
                <Link 
                  href="/login" 
                  className="text-ink hover:text-ink-light font-bold"
                >
                  Log in
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 