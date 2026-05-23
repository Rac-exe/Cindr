"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { syncGuestToAccount } from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function getReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function SignupPage() {
  const router = useRouter();
  const dobInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const returnTo = getReturnTo();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
      },
    });
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) router.replace(getReturnTo() ?? "/discover");
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  function getAge(dateString: string): number {
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function openDatePicker() {
    const input = dobInputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }

    const age = getAge(dob);
    if (age < 13) {
      setError("You must be at least 13 years old to create an account.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            date_of_birth: dob,
            is_adult: age >= 18,
          },
        },
      });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("already been registered")) {
          setError("An account with this email already exists. Try logging in instead.");
        } else {
          setError(authError.message);
        }
      } else {
        await syncGuestToAccount();
        router.push(getReturnTo() ?? "/onboarding?mode=quiz");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--color-cindr)] focus:outline-none sm:py-3";

  return (
    <div className="relative flex h-[100svh] min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[4.65rem] sm:min-h-screen sm:px-6 sm:pb-10 sm:pt-24">
      <CinematicBackdrop density="balanced" />
      <AppHeader />
      <div className="relative z-10 max-h-[calc(100svh-5.5rem)] w-full max-w-sm overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#111015]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:rounded-[2rem] sm:p-6">
        <Link href="/" className="mb-5 block text-center sm:mb-8">
          <span className="text-2xl font-semibold tracking-tight">
            Cin<span className="text-[var(--color-cindr)]">dr</span>
          </span>
        </Link>

        <h1 className="mb-2 text-center text-xl font-bold">Create account</h1>
        <p className="mb-4 text-center text-sm text-[var(--muted)] sm:mb-6">
          Save movies, build your watchlist, track what you&apos;ve seen.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50 sm:py-3"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/35">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
          <div>
            <label className="mb-1 ml-1 block text-xs text-[var(--muted)] sm:mb-1.5">
              Date of birth
            </label>
            <div className="relative">
              <input
                ref={dobInputRef}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputClass} cindr-date-input pr-11 ${!dob ? "text-[var(--muted)]" : ""}`}
                required
              />
              <button
                type="button"
                onClick={openDatePicker}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Open date picker"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className={inputClass}
            required
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--color-cindr)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:opacity-50 sm:py-3"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)] sm:mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--color-cindr)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
