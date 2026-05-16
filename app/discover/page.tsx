"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGuestState, addSwipedId, clearSwipedIds } from "@/lib/guest/storage";
import type { Movie, MovieCardData } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import SwipeDeck from "@/components/discover/SwipeDeck";
import TrailerDialog from "@/components/discover/TrailerDialog";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
  10764: "Reality",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

function toCardData(movie: Movie): MovieCardData {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterUrl: posterUrl(movie.poster_path),
    year: movie.release_date?.slice(0, 4) ?? "",
    rating: Math.round(movie.vote_average * 10) / 10,
    genres: movie.genre_ids?.map((id) => GENRE_MAP[id] ?? "").filter(Boolean) ?? [],
    language: movie.original_language?.toUpperCase() ?? "",
    runtime: movie.runtime,
    media_type: movie.media_type,
  };
}

function FilmReelDecor() {
  return (
    <svg
      className="w-16 h-16 text-[var(--color-cindr)] opacity-15"
      viewBox="0 0 120 120"
      fill="none"
    >
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="10" fill="currentColor" />
      <circle cx="60" cy="18" r="6" fill="currentColor" opacity="0.6" />
      <circle cx="60" cy="102" r="6" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="60" r="6" fill="currentColor" opacity="0.6" />
      <circle cx="102" cy="60" r="6" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function PosterSkeleton({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[min(74dvh,680px)] w-[min(92vw,440px)] overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--surface)] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent" />
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[var(--color-cindr)]/20" />
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="h-8 w-3/4 rounded-lg bg-white/10" />
          <div className="h-3 w-full rounded-full bg-white/10" />
          <div className="h-3 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
      <p className="text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

export default function DiscoverPage() {
  const [cards, setCards] = useState<MovieCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Finding something you'll love...");
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    mediaType: "movie" | "tv";
  } | null>(null);

  const fetchMovies = useCallback(async (pageNum: number, ignoreSwiped = false) => {
    try {
      const guest = getGuestState();
      const params = new URLSearchParams();
      if (guest.preferences.languages.length > 0) {
        params.set("languages", guest.preferences.languages.join(","));
      }
      if (guest.preferences.moods.length > 0) {
        params.set("moods", guest.preferences.moods.join(","));
      }
      if (guest.preferences.contentTypes.length > 0) {
        params.set("contentTypes", guest.preferences.contentTypes.join(","));
      }
      if (guest.isAdult) {
        params.set("includeAdult", "true");
      }
      params.set("page", String(pageNum));

      const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
      const data = await res.json();

      if (data.results) {
        const swiped = new Set(ignoreSwiped ? [] : guest.swipedIds);
        const newCards = (data.results as Movie[])
          .filter((m) => !swiped.has(m.id) && m.poster_path)
          .map(toCardData);
        return newCards;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch:", err);
      return [];
    }
  }, []);

  const fetchBatch = useCallback(
    async (startPage: number, ignoreSwiped = false) => {
      const pages = [startPage, startPage + 1, startPage + 2];
      const batches = await Promise.all(
        pages.map((pageNum) => fetchMovies(pageNum, ignoreSwiped))
      );
      const seen = new Set<number>();
      return batches.flat().filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });
    },
    [fetchMovies]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMessage("Finding something you'll love...");
      const newCards = await fetchBatch(1);
      setCards(newCards);
      setPage(3);
      setLoading(false);
    })();
  }, [fetchBatch]);

  async function loadMore() {
    const nextPage = page + 1;
    const newCards = await fetchBatch(nextPage);
    setPage(nextPage + 2);
    setCards((prev) => [...prev, ...newCards]);
  }

  async function showMore() {
    setLoading(true);
    setMessage("Opening up the catalog...");
    clearSwipedIds();
    const nextStart = page + 1;
    let newCards = await fetchBatch(nextStart, true);
    let nextPage = nextStart + 2;

    if (newCards.length === 0) {
      newCards = await fetchBatch(1, true);
      nextPage = 3;
    }

    setCards(newCards);
    setPage(nextPage);
    setLoading(false);
  }

  function handleSwipe(id: number, direction: "left" | "right") {
    addSwipedId(id);
    if (direction === "right") {
      const card = cards.find((c) => c.id === id);
      setSelectedMovie({
        id,
        mediaType: card?.media_type ?? "movie",
      });
    }
    setCards((prev) => prev.filter((c) => c.id !== id));

    if (cards.length <= 3) {
      loadMore();
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedMovie) {
        setSelectedMovie(null);
        return;
      }
      if (selectedMovie || cards.length === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe(cards[0].id, "left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe(cards[0].id, "right");
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, selectedMovie]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-20 md:pb-8 px-4 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <PosterSkeleton message={message} />
            </motion.div>
          ) : cards.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center max-w-xs mx-auto"
            >
              <div className="flex justify-center mb-6">
                <FilmReelDecor />
              </div>
              <h2 className="text-lg font-bold mb-2">Let&apos;s widen the search</h2>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                This batch ran thin. I can clear the already-swiped list and pull
                from deeper pages so you get more cards right away.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={showMore}
                  className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white text-sm font-medium hover:bg-[var(--color-cindr-hover)] transition-colors shadow-[0_0_20px_rgba(216,90,48,0.15)]"
                >
                  Show me more
                </button>
                <button
                  onClick={() => window.location.href = "/onboarding"}
                  className="w-full py-3 rounded-full border border-[var(--border-color)] text-sm font-medium text-[var(--muted)] hover:border-[var(--color-cindr)] hover:text-[var(--foreground)] transition-colors"
                >
                  Update preferences
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="deck"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <SwipeDeck cards={cards} onSwipe={handleSwipe} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <MobileNav />

      {selectedMovie && (
        <TrailerDialog
          movieId={selectedMovie.id}
          mediaType={selectedMovie.mediaType}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}
