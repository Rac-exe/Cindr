"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getAge(dateString: string): number {
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
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
        router.push("/onboarding");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      <CinematicBackdrop density="balanced" />
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
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`${inputClass} ${!dob ? "text-[var(--muted)]" : ""}`}
              required
            />
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
