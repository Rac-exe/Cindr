"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatCircleText, Info, SignOut, UserCircle } from "@phosphor-icons/react";
import { clearGuestState } from "@/lib/guest/storage";
import { supabase } from "@/lib/supabase/client";
import { getProfile, submitFeedbackReport } from "@/lib/supabase/core";
import CindrLogo from "@/components/layout/CindrLogo";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import type { FeedbackCategory } from "@/types/user";

export default function LandingPage() {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileInitial, setProfileInitial] = useState("U");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("feedback");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsSignedIn(Boolean(data.user));
      if (!data.user) {
        setProfileAvatarUrl("");
        setProfileInitial("U");
        return;
      }
      const profile = await getProfile();
      if (!mounted) return;
      setProfileAvatarUrl(profile?.avatar_url ?? "");
      setProfileInitial(
        (
          profile?.display_name ??
          data.user.user_metadata?.display_name ??
          data.user.email ??
          "User"
        )
          .charAt(0)
          .toUpperCase()
      );
    }
    void loadProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsSignedIn(Boolean(session?.user));
      if (!session?.user) {
        setProfileAvatarUrl("");
        setProfileInitial("U");
        return;
      }
      const profile = await getProfile();
      if (!mounted) return;
      setProfileAvatarUrl(profile?.avatar_url ?? "");
      setProfileInitial(
        (
          profile?.display_name ??
          session.user.user_metadata?.display_name ??
          session.user.email ??
          "User"
        )
          .charAt(0)
          .toUpperCase()
      );
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearGuestState();
    setIsSignedIn(false);
    setProfileMenuOpen(false);
    setFeedbackOpen(false);
    router.push("/");
  }

  function openProfilePage() {
    setProfileMenuOpen(false);
    router.push("/profile");
  }

  function openFeedbackModal(category: FeedbackCategory = "feedback") {
    setFeedbackCategory(category);
    setFeedbackStatus("");
    setProfileMenuOpen(false);
    setFeedbackOpen(true);
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackStatus("Please write something before submitting.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackStatus("");
    try {
      await submitFeedbackReport({
        category: feedbackCategory,
        message,
        pagePath: typeof window === "undefined" ? null : window.location.pathname,
        userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
      });
      setFeedbackMessage("");
      setFeedbackStatus("Thanks, your report has been saved.");
    } catch {
      setFeedbackStatus("Could not submit this right now. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] flex-col relative overflow-hidden md:min-h-screen">
      <CinematicBackdrop density="balanced" />

      <header className="relative z-30 flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="inline-flex items-center" aria-label="Cindr home">
          <CindrLogo markClassName="h-10 w-10" textClassName="text-2xl" />
        </Link>
        {isSignedIn ? (
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/85 shadow-[0_14px_42px_rgba(0,0,0,0.24)] backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
            >
              {profileAvatarUrl ? (
                <span
                  className="h-9 w-9 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${profileAvatarUrl}")` }}
                  aria-label="Profile photo"
                  role="img"
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cindr)]/20 text-sm font-bold text-[var(--color-cindr)]">
                  {profileInitial}
                </span>
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-[3.25rem] z-40 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <button
                  type="button"
                  onClick={openProfilePage}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {profileAvatarUrl ? (
                    <span
                      className="h-5 w-5 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${profileAvatarUrl}")` }}
                    />
                  ) : (
                    <UserCircle size={18} />
                  )}
                  Profile
                </button>
                <Link
                  href="/about"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Info size={18} />
                  About Cindr
                </Link>
                <button
                  type="button"
                  onClick={() => openFeedbackModal("feedback")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ChatCircleText size={18} />
                  Feedback / report issue
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <SignOut size={18} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/about"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/75 shadow-[0_14px_42px_rgba(0,0,0,0.18)] backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white/90 shadow-[0_14px_42px_rgba(0,0,0,0.2)] backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-10 items-center rounded-full bg-[var(--color-cindr)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-cindr-hover)]"
            >
              Sign up
            </Link>
          </div>
        )}
      </header>

      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111015] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-cindr)]">
                  Help improve Cindr
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Send feedback
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Tell us what felt broken, confusing, or what you want next.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
                {(["feedback", "issue"] as FeedbackCategory[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFeedbackCategory(category)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      feedbackCategory === category
                        ? "bg-[var(--color-cindr)] text-white"
                        : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {category === "feedback" ? "Feedback" : "Report issue"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/75">
                  What happened?
                </span>
                <textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  rows={5}
                  placeholder="Example: The trailer opened but would not play on mobile..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[var(--color-cindr)]/60"
                />
              </label>

              {feedbackStatus && (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70">
                  {feedbackStatus}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="rounded-full bg-[var(--color-cindr)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {feedbackSubmitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-6 text-center sm:px-6 sm:pb-0">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/52 backdrop-blur-md">
            Taste-led movie discovery
          </div>

          <h1 className="mb-5 text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.075em] text-white sm:text-6xl lg:text-7xl">
            Stop browsing.
            <br />
            Start choosing.
          </h1>

          <p className="mx-auto mb-8 max-w-lg text-base leading-7 text-white/58 sm:mb-10 sm:text-lg">
            Cindr turns movie discovery into a focused swipe flow with trailers,
            watchlists, and recommendations that adapt as you go.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isSignedIn ? "/discover" : "/onboarding?mode=quiz"}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-cindr)] px-8 text-center font-semibold text-white shadow-[0_18px_50px_rgba(216,90,48,0.2)] transition-colors hover:bg-[var(--color-cindr-hover)] sm:w-auto"
            >
              {isSignedIn ? "Continue discovering" : "Set your taste"}
            </Link>
            {isSignedIn ? (
              <Link
                href="/watchlist"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-8 text-center font-medium text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                Open watchlist
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-8 text-center font-medium text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                Create account
              </Link>
            )}
          </div>
        </div>

        <div className="mt-14 hidden w-full max-w-3xl grid-cols-1 gap-3 sm:mt-16 sm:grid sm:grid-cols-3 sm:gap-4">
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
            }
            title="Swipe to discover"
            description="One card at a time, tuned by your choices."
          />
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
            title="Watch trailers"
            description="Preview before committing to the list."
          />
          <Feature
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            }
            title="Build your list"
            description="Save favourites and track what you have seen."
          />
        </div>
      </main>

      <footer className="relative z-10 hidden py-6 text-center sm:block">
        <p className="text-[10px] text-[var(--muted)] opacity-60">
          This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-md transition-colors hover:border-white/18 hover:bg-white/[0.065] sm:block sm:text-center">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[var(--color-cindr)] sm:mx-auto sm:mb-4">
        {icon}
      </div>
      <div>
        <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
