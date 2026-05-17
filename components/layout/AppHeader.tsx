"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkSimple,
  FilmSlate,
  SlidersHorizontal,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import CindrLogo from "@/components/layout/CindrLogo";

export default function AppHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [prefsOpen, setPrefsOpen] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (prefsRef.current && !prefsRef.current.contains(event.target as Node)) {
        setPrefsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPrefsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border-color)] md:px-5 md:py-4">
      <Link href="/" className="flex items-center" aria-label="Cindr home">
        <CindrLogo markClassName="h-8 w-8" textClassName="text-xl" />
      </Link>

      {!isLanding && (
        <nav className="hidden items-center gap-1 md:flex">
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
          <NavLink
            href="/profile"
            label="Profile"
            currentPath={pathname}
            icon={UserCircle}
          />
        </nav>
      )}
    </header>
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
