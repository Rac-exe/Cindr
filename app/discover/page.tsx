"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGuestState,
  addSwipedId,
  clearSwipedIds,
  removeSwipedId,
} from "@/lib/guest/storage";
import {
  getEffectivePreferences,
  likeMovie,
  patchMovieInteraction,
} from "@/lib/supabase/core";
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

const MAX_TMDB_DISCOVER_PAGE = 500;
const SWIPED_RESHUFFLE_THRESHOLD = 200;
const INITIAL_RANDOM_BATCH_RETRIES = 1;
const RESHUFFLE_RANDOM_BATCH_RETRIES = 2;
const DISCOVER_MESSAGES = {
  finding: "Finding something you'll love...",
  tryingBatch: "Trying another batch...",
  refreshingSeen: "Refreshing seen movies...",
  checkingNext: "Checking the next batch...",
  specificFilters: "Your filters are very specific.",
} as const;

type DiscoverBatchResult = {
  cards: MovieCardData[];
  lastFetchedPage: number;
};

function randomDiscoverPage(): number {
  return Math.floor(Math.random() * MAX_TMDB_DISCOVER_PAGE) + 1;
}

function normalizeDiscoverPage(page: number): number {
  return ((page - 1) % MAX_TMDB_DISCOVER_PAGE) + 1;
}

function randomDiscoverPages(count: number): number[] {
  return Array.from({ length: count }, randomDiscoverPage);
}

function shuffleCards<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function toCardData(movie: Movie): MovieCardData {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterUrl: posterUrl(movie.poster_path),
    posterPath: movie.poster_path,
    year: movie.release_date?.slice(0, 4) ?? "",
    rating: Math.round(movie.vote_average * 10) / 10,
    genres: movie.genre_ids?.map((id) => GENRE_MAP[id] ?? "").filter(Boolean) ?? [],
    language: movie.original_language?.toUpperCase() ?? "",
    runtime: movie.runtime,
    media_type: movie.media_type,
  };
}

function PosterSkeleton({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[min(62dvh,520px)] w-[min(90vw,390px)] overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--surface)] shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:h-[min(70dvh,620px)] sm:w-[min(92vw,430px)] md:h-[min(74dvh,680px)] md:w-[min(92vw,440px)]">
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
  const [message, setMessage] = useState<string>(DISCOVER_MESSAGES.finding);
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    mediaType: "movie" | "tv";
    preview: MovieCardData;
  } | null>(null);
  const [lastSwipe, setLastSwipe] = useState<{
    card: MovieCardData;
    direction: "left" | "right";
  } | null>(null);
  const [swipeRequest, setSwipeRequest] = useState<{
    direction: "left" | "right";
    nonce: number;
    cardId: number;
  } | undefined>();
  const swipeNonce = useRef(0);

  const fetchMovies = useCallback(async (pageNum: number, ignoreSwiped = false) => {
    try {
      const { preferences, isAdult } = await getEffectivePreferences();
      const guest = getGuestState();
      const params = new URLSearchParams();
      if (preferences.languages.length > 0) {
        params.set("languages", preferences.languages.join(","));
      }
      if (preferences.moods.length > 0) {
        params.set("moods", preferences.moods.join(","));
      }
      if (preferences.genres.length > 0) {
        params.set("genres", preferences.genres.join(","));
      }
      if (preferences.contentTypes.length > 0) {
        params.set("contentTypes", preferences.contentTypes.join(","));
      }
      if (preferences.yearFrom) {
        params.set("yearFrom", String(preferences.yearFrom));
      }
      if (preferences.yearTo) {
        params.set("yearTo", String(preferences.yearTo));
      }
      const actorIds = preferences.people
        .filter((person) => person.role === "actor")
        .map((person) => person.id);
      const directorIds = preferences.people
        .filter((person) => person.role === "director")
        .map((person) => person.id);
      if (actorIds.length > 0) {
        params.set("actors", actorIds.join("|"));
      }
      if (directorIds.length > 0) {
        params.set("directors", directorIds.join("|"));
      }
      if (isAdult) {
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
      const pages = [startPage, startPage + 1, startPage + 2].map(
        normalizeDiscoverPage
      );
      const batches = await Promise.all(
        pages.map((pageNum) => fetchMovies(pageNum, ignoreSwiped))
      );
      const seen = new Set<number>();
      const deduped = batches.flat().filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });
      return shuffleCards(deduped);
    },
    [fetchMovies]
  );

  const fetchFirstAvailableBatch = useCallback(
    async (
      startPages: number[],
      ignoreSwiped = false
    ): Promise<DiscoverBatchResult> => {
      let lastFetchedPage = normalizeDiscoverPage((startPages[0] ?? 1) + 2);

      for (const startPage of startPages) {
        const normalizedStartPage = normalizeDiscoverPage(startPage);
        const cards = await fetchBatch(normalizedStartPage, ignoreSwiped);
        lastFetchedPage = normalizeDiscoverPage(normalizedStartPage + 2);

        if (cards.length > 0) {
          return { cards, lastFetchedPage };
        }
      }

      return { cards: [], lastFetchedPage };
    },
    [fetchBatch]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMessage(DISCOVER_MESSAGES.finding);
      const guest = getGuestState();
      let batch = await fetchFirstAvailableBatch([1]);

      if (batch.cards.length === 0) {
        setMessage(DISCOVER_MESSAGES.tryingBatch);
        batch = await fetchFirstAvailableBatch(
          randomDiscoverPages(INITIAL_RANDOM_BATCH_RETRIES)
        );
      }

      if (batch.cards.length === 0 && guest.swipedIds.length > 0) {
        setMessage(DISCOVER_MESSAGES.refreshingSeen);
        clearSwipedIds();
        batch = await fetchFirstAvailableBatch([1], true);
      }

      if (batch.cards.length === 0) {
        setMessage(DISCOVER_MESSAGES.specificFilters);
      }

      setCards(batch.cards);
      setPage(batch.lastFetchedPage);
      setLoading(false);
    })();
  }, [fetchFirstAvailableBatch]);

  const reshuffleDeck = useCallback(async () => {
    setLoading(true);
    const guest = getGuestState();
    const shouldClearSwipes =
      guest.swipedIds.length >= SWIPED_RESHUFFLE_THRESHOLD;
    const sequentialStartPages = [
      normalizeDiscoverPage(page + 1),
      normalizeDiscoverPage(page + 4),
    ];

    if (shouldClearSwipes) {
      setMessage(DISCOVER_MESSAGES.checkingNext);
    } else {
      setMessage(DISCOVER_MESSAGES.tryingBatch);
    }

    let batch = await fetchFirstAvailableBatch(sequentialStartPages);

    if (batch.cards.length === 0) {
      setMessage(DISCOVER_MESSAGES.tryingBatch);
      batch = await fetchFirstAvailableBatch(
        randomDiscoverPages(RESHUFFLE_RANDOM_BATCH_RETRIES)
      );
    }

    if (batch.cards.length === 0 && guest.swipedIds.length > 0) {
      setMessage(DISCOVER_MESSAGES.refreshingSeen);
      clearSwipedIds();
      batch = await fetchFirstAvailableBatch(sequentialStartPages, true);
    }

    if (batch.cards.length === 0) {
      setMessage(DISCOVER_MESSAGES.specificFilters);
    }

    setCards(batch.cards);
    setPage(batch.lastFetchedPage);
    setLoading(false);
  }, [fetchFirstAvailableBatch, page]);

  async function loadMore(randomize = false) {
    const nextPage = randomize ? randomDiscoverPage() : page + 1;
    const newCards = await fetchBatch(nextPage);
    setPage(normalizeDiscoverPage(nextPage + 2));
    setCards((prev) => [...prev, ...newCards]);
  }

  function handleSwipe(id: number, direction: "left" | "right") {
    setSwipeRequest(undefined);
    addSwipedId(id);
    const card = cards.find((c) => c.id === id);
    if (card) {
      setLastSwipe({ card, direction });
    }
    if (direction === "right" && card) {
      setSelectedMovie({
        id,
        mediaType: card.media_type ?? "movie",
        preview: card,
      });
      void likeMovie({
        tmdb_id: id,
        media_type: card.media_type ?? "movie",
        title: card.title,
        poster_path: card.posterPath ?? null,
      });
    }
    setCards((prev) => prev.filter((c) => c.id !== id));

    const remainingCards = cards.length - 1;
    if (remainingCards <= 0) {
      void reshuffleDeck();
    } else if (remainingCards <= 3) {
      void loadMore();
    }
  }

  const requestKeyboardSwipe = useCallback((direction: "left" | "right") => {
    const topCard = cards[0];
    if (!topCard) return;
    const nonce = swipeNonce.current + 1;
    swipeNonce.current = nonce;
    setSwipeRequest({ direction, nonce, cardId: topCard.id });
  }, [cards]);

  function undoLastSwipe() {
    if (!lastSwipe) return;
    removeSwipedId(lastSwipe.card.id);
    setCards((prev) => {
      if (prev.some((card) => card.id === lastSwipe.card.id)) return prev;
      return [lastSwipe.card, ...prev];
    });

    if (lastSwipe.direction === "right") {
      void patchMovieInteraction(
        {
          tmdb_id: lastSwipe.card.id,
          media_type: lastSwipe.card.media_type ?? "movie",
          title: lastSwipe.card.title,
          poster_path: lastSwipe.card.posterPath ?? null,
        },
        { liked: false }
      );
    }

    setLastSwipe(null);
  }

  useEffect(() => {
    if (
      loading ||
      cards.length > 0 ||
      message === DISCOVER_MESSAGES.specificFilters
    ) {
      return;
    }
    const retry = window.setTimeout(() => {
      void reshuffleDeck();
    }, 900);
    return () => window.clearTimeout(retry);
  }, [cards.length, loading, message, reshuffleDeck]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedMovie) {
        setSelectedMovie(null);
        return;
      }
      if (selectedMovie || cards.length === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        requestKeyboardSwipe("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        requestKeyboardSwipe("right");
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cards, requestKeyboardSwipe, selectedMovie]);

  return (
    <div className="flex flex-col min-h-[100dvh] relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center pt-14 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pt-16 md:pb-8 px-4 relative z-10 overflow-hidden">
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
              key="reshuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <PosterSkeleton message={message} />
            </motion.div>
          ) : (
            <motion.div
              key="deck"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <SwipeDeck
                cards={cards}
                onSwipe={handleSwipe}
                swipeRequest={swipeRequest}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {lastSwipe && !selectedMovie && (
          <button
            onClick={undoLastSwipe}
            className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 rounded-full border border-white/10 bg-[#111015]/90 px-4 py-2 text-xs font-semibold text-white/85 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-[var(--color-cindr)]/45 hover:text-white md:bottom-8 md:right-6"
          >
            Undo
          </button>
        )}
      </main>
      <MobileNav />

      {selectedMovie && (
        <TrailerDialog
          movieId={selectedMovie.id}
          mediaType={selectedMovie.mediaType}
          preview={selectedMovie.preview}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}
