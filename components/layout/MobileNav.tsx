"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkSimple,
  FilmSlate,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: FilmSlate },
  { href: "/watchlist", label: "Watchlist", icon: BookmarkSimple },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function MobileNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[var(--background)]/90 backdrop-blur-lg border-t border-[var(--border-color)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon as Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-20 flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition-all ${
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
