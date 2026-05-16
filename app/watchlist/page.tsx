"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

interface SavedMovie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string;
  status: "saved" | "favourite" | "watched";
  created_at: string;
}

export default function WatchlistPage() {
  const [user, setUser] = useState<unknown>(null);
  const [movies, setMovies] = useState<SavedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"saved" | "favourite" | "watched">("saved");

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("saved_movies")
          .select("*")
          .eq("user_id", (currentUser as { id: string }).id)
          .order("created_at", { ascending: false });
        if (data) setMovies(data as SavedMovie[]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = movies.filter((m) => m.status === tab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <CinematicBackdrop density="subtle" />
        <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <CinematicBackdrop density="balanced" />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16 relative z-10">
          <div className="text-center max-w-xs rounded-[2rem] border border-white/10 bg-[#111015]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="mb-4 flex justify-center">
              <svg className="w-14 h-14 text-[var(--color-cindr)] opacity-40" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="2" />
                <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="10" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">Your Watchlist</h1>
            <p className="text-sm text-[var(--muted)] mb-6">
              Sign in to save movies, mark favourites, and track what
              you&apos;ve watched.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/auth/signup"
                className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white text-sm font-medium text-center"
              >
                Create account
              </Link>
              <Link
                href="/auth/login"
                className="w-full py-3 rounded-full border border-[var(--border-color)] text-sm font-medium text-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 max-w-2xl mx-auto w-full relative z-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111015]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-5">Watchlist</h1>

        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          {(["saved", "favourite", "watched"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-[var(--color-cindr)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 text-sm text-[var(--muted)] rounded-[1.5rem] border border-white/10 bg-black/20">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-[var(--color-cindr)]/45 flex items-center justify-center text-[var(--color-cindr)]">
              <svg width="30" height="30" viewBox="0 0 60 60" fill="none" aria-hidden="true">
                <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="3" />
                <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
              </svg>
            </div>
            No {tab} movies yet. Swipe right on a trailer to start building this.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map((movie) => (
              <div
                key={movie.id}
                className="relative rounded-xl overflow-hidden border border-[var(--border-color)] aspect-[2/3]"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] font-medium text-white leading-tight line-clamp-2">
                    {movie.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
