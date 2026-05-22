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
import FeedbackDialog from "@/components/feedback/FeedbackDialog";
import { clearGuestState } from "@/lib/guest/storage";
import { supabase } from "@/lib/supabase/client";
import type { FeedbackCategory } from "@/types/user";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: FilmSlate },
  { href: "/onboarding", label: "Prefs", icon: SlidersHorizontal },
  { href: "/watchlist", label: "Watchlist", icon: BookmarkSimple },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("feedback");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (prefsRef.current && !prefsRef.current.contains(event.target as Node)) {
        setPrefsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  if (pathname === "/") return null;

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[var(--background)]/90 backdrop-blur-lg border-t border-[var(--border-color)] lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon as Icon;
        if (item.href === "/onboarding") {
          return (
            <div key={item.href} ref={prefsRef} className="relative">
              {prefsOpen && (
                <div className="fixed bottom-20 left-4 right-4 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
                  <Link
                    href="/onboarding?mode=quiz"
                    onClick={() => setPrefsOpen(false)}
                    className="block rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
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
                    className="block rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
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
              <button
                type="button"
                onClick={() => setPrefsOpen((current) => !current)}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5 transition-all ${
                  active
                    ? "bg-[var(--color-cindr)]/10 text-[var(--color-cindr)] shadow-[0_0_24px_rgba(216,90,48,0.18)]"
                    : "text-[var(--muted)] hover:text-white"
                }`}
                aria-expanded={prefsOpen}
                aria-haspopup="menu"
              >
                <Icon
                  size={22}
                  weight={active ? "fill" : "regular"}
                  className={active ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.65)]" : ""}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            </div>
          );
        }
        if (item.href === "/profile") {
          return (
            <div key={item.href} ref={profileRef} className="relative">
              {profileOpen && (
                <div className="fixed bottom-20 left-4 right-4 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111015]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md">
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
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5 transition-all ${
                  active
                    ? "bg-[var(--color-cindr)]/10 text-[var(--color-cindr)] shadow-[0_0_24px_rgba(216,90,48,0.18)]"
                    : "text-[var(--muted)] hover:text-white"
                }`}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <Icon
                  size={22}
                  weight={active ? "fill" : "regular"}
                  className={active ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.65)]" : ""}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            </div>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5 transition-all ${
              active
                ? "bg-[var(--color-cindr)]/10 text-[var(--color-cindr)] shadow-[0_0_24px_rgba(216,90,48,0.18)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <Icon
              size={22}
              weight={active ? "fill" : "regular"}
              className={active ? "drop-shadow-[0_0_8px_rgba(216,90,48,0.65)]" : ""}
            />
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
    {feedbackOpen && (
      <FeedbackDialog
        initialCategory={feedbackCategory}
        onClose={() => setFeedbackOpen(false)}
      />
    )}
    </>
  );
}
