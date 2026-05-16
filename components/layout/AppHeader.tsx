"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
      <Link href="/" className="flex items-center gap-1">
        <span className="text-xl font-semibold tracking-tight">
          Cin<span className="text-[var(--color-cindr)]">dr</span>
        </span>
      </Link>

      {!isLanding && (
        <nav className="flex items-center gap-1">
          <NavLink href="/discover" label="Discover" currentPath={pathname} />
          <NavLink href="/watchlist" label="Watchlist" currentPath={pathname} />
          <NavLink href="/profile" label="Profile" currentPath={pathname} />
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
  currentPath,
}: {
  href: string;
  label: string;
  currentPath: string;
}) {
  const active = currentPath.startsWith(href);
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "text-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}
