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

const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: FilmSlate },
  { href: "/onboarding", label: "Prefs", icon: SlidersHorizontal },
  { href: "/watchlist", label: "Watchlist", icon: BookmarkSimple },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (prefsRef.current && !prefsRef.current.contains(event.target as Node)) {
        setPrefsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[var(--background)]/90 backdrop-blur-lg border-t border-[var(--border-color)] md:hidden">
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
  );
}
