"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import {
  getSavedMovies,
  patchSavedMovieById,
} from "@/lib/supabase/core";
import type { SavedMovie } from "@/types/user";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import TrailerDialog from "@/components/discover/TrailerDialog";
import type { MovieCardData } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import { Check, Trash } from "@phosphor-icons/react";

type WatchlistTab = "liked" | "favourite" | "watched";
type WatchlistTabPatch = Partial<Pick<SavedMovie, WatchlistTab>>;

const TABS: { key: WatchlistTab; label: string }[] = [
  { key: "liked", label: "Liked" },
  { key: "favourite", label: "Favourite" },
  { key: "watched", label: "Watched" },
];

export default function WatchlistPage() {
  const [user, setUser] = useState<unknown>(null);
  const [movies, setMovies] = useState<SavedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WatchlistTab>("liked");
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    mediaType: "movie" | "tv";
    preview: MovieCardData;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const data = await getSavedMovies();
        setMovies(data);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = movies.filter((m) => m[tab]);
  const selectedCount = selectedIds.length;

  async function handleShare(movie: SavedMovie) {
    const path = `/m/${movie.media_type}/${movie.tmdb_id}`;
    const url = `${window.location.origin}${path}`;
    const title = `${movie.title} on Cindr`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out ${movie.title} on Cindr.`,
          url,
        });
        setShareMessage("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      }
      window.setTimeout(() => setShareMessage(null), 1800);
    } catch {
      setShareMessage(null);
    }
  }

  function handleInteractionChange(interaction: SavedMovie) {
    setMovies((prev) => {
      const exists = prev.some((m) => m.id === interaction.id);
      if (!exists) return [interaction, ...prev];
      return prev.map((m) => (m.id === interaction.id ? interaction : m));
    });
  }

  function toggleSelection(movieId: string) {
    setSelectedIds((current) =>
      current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId]
    );
  }

  function handleCardClick(movie: SavedMovie) {
    if (selectionMode) {
      toggleSelection(movie.id);
      return;
    }
    openMovie(movie);
  }

  function handleTabChange(nextTab: WatchlistTab) {
    setTab(nextTab);
    setSelectionMode(false);
    setSelectedIds([]);
  }

  async function removeSelectedFromCurrentTab() {
    if (selectedIds.length === 0) return;

    const idsToRemove = selectedIds;
    const tabPatch = { [tab]: false } as WatchlistTabPatch;
    setBulkRemoving(true);
    setMovies((current) =>
      current.map((movie) =>
        idsToRemove.includes(movie.id) ? { ...movie, [tab]: false } : movie
      )
    );
    setSelectedIds([]);
    setSelectionMode(false);

    try {
      await Promise.all(
        idsToRemove.map((id) => patchSavedMovieById(id, tabPatch))
      );
      setShareMessage("Removed");
      window.setTimeout(() => setShareMessage(null), 1400);
    } catch {
      setShareMessage("Could not remove");
      window.setTimeout(() => setShareMessage(null), 1800);
    } finally {
      setBulkRemoving(false);
    }
  }

  function openMovie(movie: SavedMovie) {
    setSelectedMovie({
      id: movie.tmdb_id,
      mediaType: movie.media_type,
      preview: {
        id: movie.tmdb_id,
        title: movie.title,
        overview: "",
        posterUrl: posterUrl(movie.poster_path),
        posterPath: movie.poster_path,
        year: "",
        rating: movie.rating ?? 0,
        genres: [],
        language: "",
        media_type: movie.media_type,
      },
    });
  }

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
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Watchlist</h1>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectionMode((current) => !current);
                setSelectedIds([]);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectionMode
                  ? "border-[var(--color-cindr)]/45 bg-[var(--color-cindr)]/12 text-[var(--color-cindr)]"
                  : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
              }`}
            >
              {selectionMode ? "Done" : "Select"}
            </button>
          )}
        </div>

        {shareMessage && (
          <div className="mb-3 rounded-full border border-[var(--color-cindr)]/30 bg-[var(--color-cindr)]/10 px-3 py-2 text-center text-xs text-[var(--color-cindr)]">
            {shareMessage}
          </div>
        )}

        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/10 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 whitespace-nowrap py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-[var(--color-cindr)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {selectionMode && filtered.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/[0.035] p-1">
            <button
              type="button"
              onClick={() =>
                setSelectedIds((current) =>
                  current.length === filtered.length
                    ? []
                    : filtered.map((movie) => movie.id)
                )
              }
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {selectedCount === filtered.length ? "Clear" : "All"}
            </button>
            <span className="text-xs font-medium text-white/45">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={removeSelectedFromCurrentTab}
              disabled={selectedCount === 0 || bulkRemoving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cindr)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash size={13} weight="bold" />
              {bulkRemoving ? "Removing" : "Remove"}
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 text-sm text-[var(--muted)] rounded-[1.5rem] border border-white/10 bg-black/20">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-[var(--color-cindr)]/45 flex items-center justify-center text-[var(--color-cindr)]">
              <svg width="30" height="30" viewBox="0 0 60 60" fill="none" aria-hidden="true">
                <circle cx="30" cy="30" r="26" stroke="currentColor" strokeWidth="3" />
                <path d="M24 18l18 12-18 12V18z" fill="currentColor" />
              </svg>
            </div>
            No {tab} titles yet. Swipe right, save, or rate something to start building this.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((movie) => (
              <div
                key={movie.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(movie)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(movie);
                  }
                }}
                className={`group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl border transition-colors ${
                  selectedIds.includes(movie.id)
                    ? "border-[var(--color-cindr)]/80"
                    : "border-[var(--border-color)] hover:border-[var(--color-cindr)]/45"
                }`}
              >
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 220px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-xs p-2 text-center">
                    {movie.title}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] font-medium text-white leading-tight line-clamp-2">
                    {movie.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {movie.media_type === "tv" && (
                      <span className="text-[8px] text-[var(--color-cindr)]">TV</span>
                    )}
                    {movie.favourite && (
                      <span className="rounded-full bg-yellow-400/90 px-1.5 py-0.5 text-[8px] font-bold text-black">
                        Star
                      </span>
                    )}
                    {movie.watched && (
                      <span className="rounded-full bg-green-400/90 px-1.5 py-0.5 text-[8px] font-bold text-black">
                        Watched
                      </span>
                    )}
                    {movie.rating && (
                      <span className="rounded-full bg-[var(--color-cindr)] px-1.5 py-0.5 text-[8px] font-bold text-white">
                        {movie.rating}/10
                      </span>
                    )}
                  </div>
                </div>

                {selectionMode && (
                  <div
                    className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border backdrop-blur-md transition-colors ${
                      selectedIds.includes(movie.id)
                        ? "border-[var(--color-cindr)] bg-[var(--color-cindr)] text-white"
                        : "border-white/20 bg-black/35 text-white/45"
                    }`}
                  >
                    {selectedIds.includes(movie.id) && (
                      <Check size={15} weight="bold" />
                    )}
                  </div>
                )}

                {!selectionMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55 p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMovie(movie);
                      }}
                      className="w-full rounded-lg border border-white/15 bg-white/10 py-1.5 text-[10px] font-medium text-white"
                    >
                      Open details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(movie);
                      }}
                      className="w-full rounded-lg bg-white/10 py-1.5 text-[10px] font-medium text-white"
                    >
                      Share
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
      <MobileNav />
      {selectedMovie && (
        <TrailerDialog
          movieId={selectedMovie.id}
          mediaType={selectedMovie.mediaType}
          preview={selectedMovie.preview}
          sourceList={tab}
          onInteractionChange={handleInteractionChange}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}
