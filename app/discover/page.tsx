"use client";

import { useState, useEffect, useCallback } from "react";
import { getGuestState, addSwipedId } from "@/lib/guest/storage";
import type { Movie, MovieCardData } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import SwipeDeck from "@/components/discover/SwipeDeck";
import TrailerDialog from "@/components/discover/TrailerDialog";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";

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
  };
}

export default function DiscoverPage() {
  const [cards, setCards] = useState<MovieCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null);

  const fetchMovies = useCallback(async (pageNum: number) => {
    try {
      const guest = getGuestState();
      const params = new URLSearchParams();
      if (guest.preferences.languages.length > 0) {
        params.set("languages", guest.preferences.languages.join(","));
      }
      if (guest.preferences.moods.length > 0) {
        params.set("moods", guest.preferences.moods.join(","));
      }
      params.set("page", String(pageNum));

      const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
      const data = await res.json();

      if (data.results) {
        const swiped = new Set(guest.swipedIds);
        const newCards = (data.results as Movie[])
          .filter((m) => !swiped.has(m.id) && m.poster_path)
          .map(toCardData);
        return newCards;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const newCards = await fetchMovies(1);
      setCards(newCards);
      setLoading(false);
    })();
  }, [fetchMovies]);

  async function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    const newCards = await fetchMovies(nextPage);
    setCards((prev) => [...prev, ...newCards]);
  }

  function handleSwipe(id: number, direction: "left" | "right") {
    addSwipedId(id);
    if (direction === "right") {
      setSelectedMovie(id);
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
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-20 md:pb-8 px-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--muted)]">
              Finding movies for you...
            </p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No more movies!</p>
            <p className="text-sm text-[var(--muted)] mb-4">
              You&apos;ve seen them all. Adjust your preferences or check back later.
            </p>
            <button
              onClick={() => {
                setPage(1);
                fetchMovies(1).then(setCards);
              }}
              className="px-6 py-2.5 rounded-full bg-[var(--color-cindr)] text-white text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        ) : (
          <SwipeDeck cards={cards} onSwipe={handleSwipe} />
        )}
      </main>
      <MobileNav />

      {selectedMovie && (
        <TrailerDialog
          movieId={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}
