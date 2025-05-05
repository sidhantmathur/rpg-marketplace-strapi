"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface ProfileButtonProps {
  className?: string;
}

export function ProfileButton({ className = "" }: ProfileButtonProps) {
  const router = useRouter();
  const { user, loading } = useUser();

  const handleClick = () => {
    if (!user?.id) {
      console.error("[ProfileButton] No user ID available");
      return;
    }
    console.log("[ProfileButton] Navigating to profile:", `/profile/${user.id}`);
    router.push(`/profile/${user.id}`);
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-white cursor-not-allowed ${className}`}
      >
        <User className="h-5 w-5" />
        <span>Loading...</span>
      </button>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 ${className}`}
    >
      <User className="h-5 w-5" />
      <span>Profile</span>
    </button>
  );
} 