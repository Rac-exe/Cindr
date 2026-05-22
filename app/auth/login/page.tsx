"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { syncGuestToAccount, getDbPreferences } from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";

function getReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) router.replace(getReturnTo() ?? "/discover");
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        await syncGuestToAccount();
        const prefs = await getDbPreferences();
        router.push(
          getReturnTo() ??
            (prefs?.onboarding_complete ? "/discover" : "/onboarding?mode=quiz")
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 relative overflow-hidden">
      <CinematicBackdrop density="balanced" />
      <AppHeader />
      <div className="w-full max-w-sm relative z-10 rounded-[2rem] border border-white/10 bg-[#111015]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-semibold tracking-tight">
            Cin<span className="text-[var(--color-cindr)]">dr</span>
          </span>
        </Link>

        <h1 className="text-xl font-bold text-center mb-6">Welcome back</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--color-cindr)] transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--color-cindr)] transition-colors"
            required
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white font-medium text-sm hover:bg-[var(--color-cindr-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[var(--color-cindr)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
