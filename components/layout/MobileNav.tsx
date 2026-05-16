"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: "🎬" },
  { href: "/watchlist", label: "Watchlist", icon: "📌" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function MobileNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[var(--background)]/90 backdrop-blur-lg border-t border-[var(--border-color)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
              active ? "text-[var(--color-cindr)]" : "text-[var(--muted)]"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
