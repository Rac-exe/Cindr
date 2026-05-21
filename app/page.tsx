"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatCircleText, Info, SignOut, UserCircle } from "@phosphor-icons/react";
import { clearGuestState } from "@/lib/guest/storage";
import { supabase } from "@/lib/supabase/client";
import { getProfile, submitFeedbackReport } from "@/lib/supabase/core";
import CindrLogo from "@/components/layout/CindrLogo";
import type { FeedbackCategory } from "@/types/user";

function FilmReel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="2.75" />
      <circle cx="60" cy="60" r="10" fill="currentColor" />
      {/* Sprocket holes */}
      <circle cx="60" cy="18" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="102" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="102" cy="60" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="30" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
      {/* Spokes */}
      <line x1="60" y1="18" x2="60" y2="48" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="72" x2="60" y2="102" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="60" x2="48" y2="60" stroke="currentColor" strokeWidth="2" />
      <line x1="72" y1="60" x2="102" y2="60" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FilmStrip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="46" height="258" rx="3" stroke="currentColor" strokeWidth="3" />
      {/* Sprocket holes left & right, repeated */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <g key={i}>
          <rect x="4" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="35" y={8 + i * 20} width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </g>
      ))}
      {/* Frame lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <line key={`f${i}`} x1="14" y1={20 + i * 20} x2="34" y2={20 + i * 20} stroke="currentColor" strokeWidth="1.25" opacity="0.75" />
      ))}
    </svg>
  );
}

function Clapperboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Board body */}
      <rect x="4" y="24" width="92" height="52" rx="4" stroke="currentColor" strokeWidth="3.5" />
      {/* Top clapper */}
      <path d="M4 28L4 18a4 4 0 014-4h84a4 4 0 014 4v10" stroke="currentColor" strokeWidth="3.5" />
      {/* Stripe lines on clapper */}
      <line x1="20" y1="14" x2="28" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="38" y1="14" x2="46" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="56" y1="14" x2="64" y2="28" stroke="currentColor" strokeWidth="3" />
      <line x1="74" y1="14" x2="82" y2="28" stroke="currentColor" strokeWidth="3" />
      {/* Hinge circle */}
      <circle cx="10" cy="21" r="4" fill="currentColor" />
    </svg>
  );
}

function PlayButton({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="3.5" />
      <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
    </svg>
  );
}

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
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Cinematic decorations spread across the whole page */}
      <div className="pointer-events-none absolute inset-0 text-[#F0642F] drop-shadow-[0_0_4px_rgba(216,90,48,0.8)] drop-shadow-[0_0_12px_rgba(216,90,48,0.45)]">
        {/* Film reels */}
        <FilmReel className="absolute -top-10 -right-16 h-44 w-44 origin-center animate-[spin_34s_linear_infinite] opacity-80 sm:-top-6 sm:-right-6 sm:h-52 sm:w-52 sm:opacity-85" />
        <FilmReel className="absolute -bottom-10 -left-10 h-40 w-40 origin-center animate-[spin_38s_linear_infinite_reverse] opacity-75" />
        <FilmReel className="absolute top-[55%] right-[8%] hidden h-24 w-24 origin-center animate-[spin_30s_linear_infinite] opacity-60 md:block" />
        <FilmReel className="absolute top-[20%] left-[5%] hidden h-20 w-20 origin-center animate-[spin_32s_linear_infinite_reverse] opacity-55 md:block" />
        <FilmReel className="absolute top-[80%] left-[40%] hidden h-16 w-16 origin-center animate-[spin_28s_linear_infinite] opacity-40 md:block" />
        <FilmReel className="absolute top-[10%] right-[30%] hidden h-14 w-14 origin-center animate-[spin_26s_linear_infinite_reverse] opacity-35 lg:block" />
        <FilmReel className="absolute bottom-[5%] right-[45%] hidden h-18 w-18 origin-center animate-[spin_36s_linear_infinite] opacity-48 md:block" />

        {/* Film strips */}
        <FilmStrip className="absolute left-6 top-8 w-7 opacity-80 hidden lg:block" />
        <FilmStrip className="absolute right-6 top-16 w-7 opacity-70 hidden lg:block" />
        <FilmStrip className="absolute left-[25%] bottom-4 w-6 opacity-55 rotate-[8deg] hidden lg:block" />
        <FilmStrip className="absolute right-[30%] top-4 w-5 opacity-48 -rotate-6 hidden lg:block" />
        <FilmStrip className="absolute left-[60%] top-[15%] w-5 opacity-42 rotate-[15deg] hidden lg:block" />
        <FilmStrip className="absolute right-[55%] bottom-[10%] w-6 opacity-48 -rotate-[10deg] hidden lg:block" />

        {/* Clapperboards */}
        <Clapperboard className="absolute top-[12%] left-[15%] w-24 opacity-62 -rotate-12 hidden sm:block" />
        <Clapperboard className="absolute bottom-[22%] right-[12%] w-20 opacity-55 rotate-6 hidden sm:block" />
        <Clapperboard className="absolute top-[65%] left-[55%] w-16 opacity-42 rotate-3 hidden md:block" />
        <Clapperboard className="absolute top-[40%] left-[8%] w-14 opacity-35 rotate-[20deg] hidden lg:block" />
        <Clapperboard className="absolute bottom-[8%] left-[35%] w-18 opacity-48 -rotate-6 hidden md:block" />
        <Clapperboard className="absolute top-[5%] right-[15%] w-12 opacity-34 rotate-12 hidden lg:block" />

        {/* Play buttons */}
        <PlayButton className="absolute top-[30%] right-[20%] w-12 opacity-62 hidden sm:block" />
        <PlayButton className="absolute bottom-[35%] left-[25%] w-10 opacity-48 hidden md:block" />
        <PlayButton className="absolute top-[75%] right-[35%] w-8 opacity-42 hidden md:block" />
        <PlayButton className="absolute top-[18%] left-[45%] w-9 opacity-34 hidden lg:block" />
        <PlayButton className="absolute bottom-[15%] right-[25%] w-11 opacity-48 hidden md:block" />
        <PlayButton className="absolute top-[50%] left-[18%] w-7 opacity-34 hidden lg:block" />
        <PlayButton className="absolute bottom-[40%] right-[8%] w-10 opacity-42 hidden md:block" />
      </div>

      <header className="relative z-30 flex items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center" aria-label="Cindr home">
          <CindrLogo markClassName="h-10 w-10" textClassName="text-3xl" />
        </Link>
        {isSignedIn ? (
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/85 shadow-[0_0_18px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-colors hover:border-[var(--color-cindr)]/45 hover:bg-white/[0.1] hover:text-white"
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
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/75 shadow-[0_0_18px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:px-3.5"
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-white/90 shadow-[0_0_18px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-4 py-2 rounded-full bg-[var(--color-cindr)] text-white hover:bg-[var(--color-cindr-hover)] transition-colors"
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-px bg-[var(--color-cindr)] opacity-60" />
            <div className="w-2 h-2 rounded-full bg-[var(--color-cindr)] opacity-50" />
            <div className="w-10 h-px bg-[var(--color-cindr)] opacity-60" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
            Find your perfect match.
            <br />
            <span className="text-[var(--color-cindr)] drop-shadow-[0_0_40px_rgba(216,90,48,0.4)]">
              Movie edition.
            </span>
          </h1>

          <p className="text-lg text-[var(--muted)] mb-10 max-w-md mx-auto leading-relaxed">
            Stop scrolling. Start swiping. One movie at a time, personalised to
            your taste.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isSignedIn ? "/discover" : "/onboarding?mode=quiz"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--color-cindr)] text-white font-medium hover:bg-[var(--color-cindr-hover)] transition-all text-center shadow-[0_0_35px_rgba(216,90,48,0.3)] hover:shadow-[0_0_50px_rgba(216,90,48,0.5)]"
            >
              {isSignedIn ? "Continue swiping" : "Start swiping"}
            </Link>
            {isSignedIn ? (
              <Link
                href="/watchlist"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[var(--border-color)] text-[var(--foreground)] font-medium hover:bg-[var(--surface)] hover:border-[var(--muted)] transition-all text-center"
              >
                Open watchlist
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[var(--border-color)] text-[var(--foreground)] font-medium hover:bg-[var(--surface)] hover:border-[var(--muted)] transition-all text-center"
              >
                Create account
              </Link>
            )}
          </div>
        </div>

        <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-3 sm:mt-20 sm:grid-cols-3 sm:gap-5">
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
            }
            title="Swipe to discover"
            description="Movie cards served one at a time. Right for yes, left for nah."
          />
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
            title="Watch trailers"
            description="Swipe right and the trailer plays instantly. No hunting around."
          />
          <Feature
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            }
            title="Build your list"
            description="Save favourites, track what to watch. Your personal cinema queue."
          />
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center">
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
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#151419]/85 p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all hover:border-[var(--color-cindr)]/35 sm:block sm:p-5 sm:text-center">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-cindr)]/55 to-transparent sm:inset-x-8" />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-cindr)]/20 bg-[var(--color-cindr)]/10 text-[var(--color-cindr)] shadow-[0_0_22px_rgba(216,90,48,0.14)] sm:mx-auto sm:mb-4">
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
