"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-link hover:text-link-hover"
    >
      Sign out
    </button>
  );
}
