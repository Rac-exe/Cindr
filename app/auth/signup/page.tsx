"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { syncGuestToAccount } from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";

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
      if (mounted && data.user) router.replace("/discover");
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
        router.push("/onboarding?mode=quiz");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--color-cindr)] transition-colors";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-10 pt-24 relative overflow-hidden">
      <CinematicBackdrop density="balanced" />
      <AppHeader />
      <div className="w-full max-w-sm relative z-10 rounded-[2rem] border border-white/10 bg-[#111015]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-semibold tracking-tight">
            Cin<span className="text-[var(--color-cindr)]">dr</span>
          </span>
        </Link>

        <h1 className="text-xl font-bold text-center mb-2">Create account</h1>
        <p className="text-center text-sm text-[var(--muted)] mb-6">
          Save movies, build your watchlist, track what you&apos;ve seen.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            <label className="block text-xs text-[var(--muted)] mb-1.5 ml-1">
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
            className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white font-medium text-sm hover:bg-[var(--color-cindr-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
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
