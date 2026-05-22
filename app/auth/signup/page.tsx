"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { syncGuestToAccount } from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";

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
        setError(authError.message);
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
