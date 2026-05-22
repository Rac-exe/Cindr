"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkSimple,
  ChatCircleText,
  FilmSlate,
  Info,
  SignOut,
  SlidersHorizontal,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import CindrLogo from "@/components/layout/CindrLogo";
import FeedbackDialog from "@/components/feedback/FeedbackDialog";
import { clearGuestState } from "@/lib/guest/storage";
import { supabase } from "@/lib/supabase/client";
import type { FeedbackCategory } from "@/types/user";

export default function AppHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("feedback");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsSignedIn(Boolean(data.user));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (prefsRef.current && !prefsRef.current.contains(event.target as Node)) {
        setPrefsOpen(false);
      }
      const insideProfile =
        Boolean(profileRef.current?.contains(target)) ||
        Boolean(mobileProfileRef.current?.contains(target));
      if (!insideProfile) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPrefsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openFeedbackModal(category: FeedbackCategory = "feedback") {
    setFeedbackCategory(category);
    setProfileOpen(false);
    setFeedbackOpen(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearGuestState();
    setProfileOpen(false);
    window.location.assign("/");
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border-color)] md:px-5 md:py-4">
        <Link href="/" className="flex items-center" aria-label="Cindr home">
          <CindrLogo markClassName="h-8 w-8" textClassName="text-xl" />
        </Link>

        {!isLanding && (
          <nav className="hidden items-center gap-1 lg:flex">
          <NavLink
            href="/discover"
            label="Discover"
            currentPath={pathname}
            icon={FilmSlate}
          />
          <div ref={prefsRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setPrefsOpen((current) => !current)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith("/onboarding")
                  ? "text-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              aria-expanded={prefsOpen}
              aria-haspopup="menu"
            >
              <SlidersHorizontal
                size={16}
                weight={pathname.startsWith("/onboarding") ? "fill" : "regular"}
                className={
                  pathname.startsWith("/onboarding")
                    ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.55)]"
                    : ""
                }
              />
              Preferences
            </button>
            {prefsOpen && (
              <div className="absolute right-0 top-[2.35rem] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <Link
                  href="/onboarding?mode=quiz"
                  onClick={() => setPrefsOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <span className="block text-sm font-semibold text-white/85">
                    Refresh taste profile
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--muted)]">
                    Languages, content, moods.
                  </span>
                </Link>
                <Link
                  href="/onboarding?mode=advanced"
                  onClick={() => setPrefsOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <span className="block text-sm font-semibold text-white/85">
                    Advanced filters
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--muted)]">
                    Years, genres, actors, directors.
                  </span>
                </Link>
              </div>
            )}
          </div>
          <NavLink
            href="/watchlist"
            label="Watchlist"
            currentPath={pathname}
            icon={BookmarkSimple}
          />
          <div ref={profileRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className={`grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors ${
                pathname.startsWith("/profile")
                  ? "text-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <UserCircle
                size={22}
                weight={pathname.startsWith("/profile") ? "fill" : "regular"}
                className={
                  pathname.startsWith("/profile")
                    ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.55)]"
                    : ""
                }
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[2.35rem] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <UserCircle size={18} />
                  Profile
                </Link>
                <Link
                  href="/about"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
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
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <SignOut size={18} />
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
          </nav>
        )}
        {!isLanding && (
          <div ref={mobileProfileRef} className="relative flex items-center gap-2 lg:hidden">
            {profileOpen && (
              <div className="absolute right-0 top-[3rem] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <UserCircle size={18} />
                  Profile
                </Link>
                <Link
                  href="/about"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Info size={18} />
                  About Cindr
                </Link>
                <button
                  type="button"
                  onClick={() => openFeedbackModal("feedback")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ChatCircleText size={18} />
                  Feedback / report issue
                </button>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <SignOut size={18} />
                    Sign out
                  </button>
                ) : (
                  <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setProfileOpen(false)}
                      className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-sm font-medium text-white/75"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setProfileOpen(false)}
                      className="rounded-xl bg-[var(--color-cindr)] px-3 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>
      {feedbackOpen && (
        <FeedbackDialog
          initialCategory={feedbackCategory}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </>
  );
}

function NavLink({
  href,
  label,
  currentPath,
  icon,
}: {
  href: string;
  label: string;
  currentPath: string;
  icon?: Icon;
}) {
  const active = currentPath.startsWith(href);
  const NavIcon = icon;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "text-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {NavIcon && (
        <NavIcon
          size={16}
          weight={active ? "fill" : "regular"}
          className={active ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.55)]" : ""}
        />
      )}
      {label}
    </Link>
  );
}
