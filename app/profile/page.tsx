"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { clearGuestState } from "@/lib/guest/storage";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearGuestState();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <CinematicBackdrop density="subtle" />
        <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <CinematicBackdrop density="balanced" />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16 relative z-10">
          <div className="text-center max-w-xs rounded-[2rem] border border-white/10 bg-[#111015]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="mb-4 flex justify-center">
              <svg className="w-14 h-14 text-[var(--color-cindr)] opacity-40" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="2" />
                <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="10" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">Your Profile</h1>
            <p className="text-sm text-[var(--muted)] mb-6">
              Sign in to manage your preferences, track your activity, and
              personalise your experience.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/auth/signup"
                className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white text-sm font-medium text-center"
              >
                Create account
              </Link>
              <Link
                href="/auth/login"
                className="w-full py-3 rounded-full border border-[var(--border-color)] text-sm font-medium text-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  const displayName =
    user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 max-w-md mx-auto w-full relative z-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111015]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-cindr)]/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-[var(--color-cindr)]">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/onboarding"
            className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
          >
            <span className="text-sm font-medium">Update preferences</span>
            <span className="text-[var(--muted)]">&rarr;</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
