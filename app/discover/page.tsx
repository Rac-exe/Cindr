"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGuestState,
  addSwipedId,
  clearSwipedIds,
  removeSwipedId,
  queuePendingInteraction,
  savePreferences,
} from "@/lib/guest/storage";
import {
  getCurrentUserId,
  getEffectivePreferences,
  likeMovie,
  patchMovieInteraction,
  upsertPreferences,
} from "@/lib/supabase/core";
import type { Movie, MovieCardData } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import type { DiscoverMode, UserPreferences } from "@/types/user";
import SwipeDeck from "@/components/discover/SwipeDeck";
import TrailerDialog from "@/components/discover/TrailerDialog";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { prewarmTrailers } from "@/lib/client/trailerCache";

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
const PREFETCH_CARD_THRESHOLD = 8;
const PREWARM_CARD_COUNT = 3;
const DISCOVER_MESSAGES = {
  finding: "Finding something you'll love...",
  randomFinding: "Rolling a random reel...",
  tryingBatch: "Trying another batch...",
  refreshingSeen: "Refreshing seen movies...",
  checkingNext: "Checking the next batch...",
  specificFilters: "Your hard filters are very specific. Try widening years, genres, or people.",
} as const;

type DiscoverBatchResult = {
  cards: MovieCardData[];
  lastFetchedPage: number;
};

const DEFAULT_DISCOVER_PREFERENCES: UserPreferences = {
  languages: [],
  genres: [],
  moods: [],
  contentTypes: [],
  yearFrom: null,
  yearTo: null,
  people: [],
  discoverMode: "taste",
  era: "any",
  runtimePreference: "any",
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

function findingMessage(mode: DiscoverMode): string {
  return mode === "random"
    ? DISCOVER_MESSAGES.randomFinding
    : DISCOVER_MESSAGES.finding;
}

function hasHardFilters(preferences: UserPreferences): boolean {
  return (
    preferences.genres.length > 0 ||
    Boolean(preferences.yearFrom) ||
    Boolean(preferences.yearTo) ||
    preferences.people.length > 0
  );
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
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-[min(58dvh,500px)] w-[min(86vw,360px)] overflow-hidden rounded-[1.75rem] border border-[var(--color-cindr)]/18 bg-[#111015]/86 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:h-[min(66dvh,580px)] sm:w-[min(88vw,390px)] md:h-[min(70dvh,620px)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(216,90,48,0.18),transparent_32%),linear-gradient(115deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015),rgba(216,90,48,0.08))]" />
        <div className="absolute left-5 right-5 top-5 flex justify-between opacity-35">
          {[0, 1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className="h-2 w-5 rounded-sm border border-[var(--color-cindr)]/60"
            />
          ))}
        </div>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.25s_infinite] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="absolute inset-x-12 top-1/2 h-20 -translate-y-1/2 rounded-full bg-[var(--color-cindr)]/8 blur-2xl" />
        <div className="absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/10" />
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="h-1 w-12 rounded-full bg-[var(--color-cindr)]/80" />
          <div className="h-8 w-3/4 rounded-lg bg-white/10" />
          <div className="h-3 w-full rounded-full bg-white/8" />
          <div className="h-3 w-2/3 rounded-full bg-white/8" />
        </div>
      </div>
      <p className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-medium text-white/50">
        {message}
      </p>
    </div>
  );
}

export default function DiscoverPage() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_DISCOVER_PREFERENCES
  );
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [cards, setCards] = useState<MovieCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>(DISCOVER_MESSAGES.finding);
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    mediaType: "movie" | "tv";
    preview: MovieCardData;
    initialInteraction?: { liked: boolean };
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
  const modalHistoryPushed = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const fetchMovies = useCallback(async (
    pageNum: number,
    activePreferences: UserPreferences,
    ignoreSwiped = false,
    signal?: AbortSignal
  ) => {
    try {
      const guest = getGuestState();
      const params = new URLSearchParams();
      const mode = activePreferences.discoverMode;

      params.set("mode", mode);
      if (mode === "taste" && activePreferences.languages.length > 0) {
        params.set("languages", activePreferences.languages.join(","));
      }
      if (mode === "taste" && activePreferences.moods.length > 0) {
        params.set("moods", activePreferences.moods.join(","));
      }
      if (activePreferences.genres.length > 0) {
        params.set("genres", activePreferences.genres.join(","));
      }
      if (activePreferences.contentTypes.length > 0) {
        params.set("contentTypes", activePreferences.contentTypes.join(","));
      }
      if (activePreferences.yearFrom) {
        params.set("yearFrom", String(activePreferences.yearFrom));
      }
      if (activePreferences.yearTo) {
        params.set("yearTo", String(activePreferences.yearTo));
      }
      if (mode === "taste" && activePreferences.era !== "any") {
        params.set("era", activePreferences.era);
      }
      if (mode === "taste" && activePreferences.runtimePreference !== "any") {
        params.set("length", activePreferences.runtimePreference);
      }
      const actorIds = activePreferences.people
        .filter((person) => person.role === "actor")
        .map((person) => person.id);
      const directorIds = activePreferences.people
        .filter((person) => person.role === "director")
        .map((person) => person.id);
      if (actorIds.length > 0) {
        params.set("actors", actorIds.join("|"));
      }
      if (directorIds.length > 0) {
        params.set("directors", directorIds.join("|"));
      }
      params.set("page", String(pageNum));

      const res = await fetch(`/api/tmdb/discover?${params.toString()}`, {
        signal,
      });
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
      if ((err as Error).name === "AbortError") return [];
      console.error("Failed to fetch:", err);
      return [];
    }
  }, []);

  const fetchBatch = useCallback(
    async (
      startPage: number,
      activePreferences: UserPreferences,
      ignoreSwiped = false,
      signal?: AbortSignal
    ) => {
      const pages = [startPage, startPage + 1, startPage + 2].map(
        normalizeDiscoverPage
      );
      const batches = await Promise.all(
        pages.map((pageNum) =>
          fetchMovies(pageNum, activePreferences, ignoreSwiped, signal)
        )
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
      activePreferences: UserPreferences,
      ignoreSwiped = false,
      signal?: AbortSignal
    ): Promise<DiscoverBatchResult> => {
      let lastFetchedPage = normalizeDiscoverPage((startPages[0] ?? 1) + 2);

      for (const startPage of startPages) {
        const normalizedStartPage = normalizeDiscoverPage(startPage);
        const cards = await fetchBatch(
          normalizedStartPage,
          activePreferences,
          ignoreSwiped,
          signal
        );
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
    let cancelled = false;

    (async () => {
      const { preferences: effectivePreferences } = await getEffectivePreferences();
      if (cancelled) return;
      setPreferences({
        ...DEFAULT_DISCOVER_PREFERENCES,
        ...effectivePreferences,
      });
      setPreferencesReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setMessage(findingMessage(preferences.discoverMode));
      const guest = getGuestState();
      const initialPages =
        preferences.discoverMode === "random"
          ? randomDiscoverPages(Math.max(1, INITIAL_RANDOM_BATCH_RETRIES))
          : [1];
      let batch = await fetchFirstAvailableBatch(
        initialPages,
        preferences,
        false,
        controller.signal
      );

      if (batch.cards.length === 0) {
        setMessage(DISCOVER_MESSAGES.tryingBatch);
        batch = await fetchFirstAvailableBatch(
          randomDiscoverPages(INITIAL_RANDOM_BATCH_RETRIES),
          preferences,
          false,
          controller.signal
        );
      }

      if (batch.cards.length === 0 && guest.swipedIds.length > 0) {
        setMessage(DISCOVER_MESSAGES.refreshingSeen);
        clearSwipedIds();
        batch = await fetchFirstAvailableBatch(
          initialPages,
          preferences,
          true,
          controller.signal
        );
      }

      if (batch.cards.length === 0) {
        setMessage(
          hasHardFilters(preferences)
            ? DISCOVER_MESSAGES.specificFilters
            : DISCOVER_MESSAGES.tryingBatch
        );
      }

      if (controller.signal.aborted) return;
      setCards(batch.cards);
      setPage(batch.lastFetchedPage);
      setLoading(false);
    })();

    return () => controller.abort();
  }, [fetchFirstAvailableBatch, preferences, preferencesReady]);

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

    const candidatePages =
      preferences.discoverMode === "random"
        ? randomDiscoverPages(RESHUFFLE_RANDOM_BATCH_RETRIES)
        : sequentialStartPages;

    let batch = await fetchFirstAvailableBatch(candidatePages, preferences);

    if (batch.cards.length === 0) {
      setMessage(DISCOVER_MESSAGES.tryingBatch);
      batch = await fetchFirstAvailableBatch(
        randomDiscoverPages(RESHUFFLE_RANDOM_BATCH_RETRIES),
        preferences
      );
    }

    if (batch.cards.length === 0 && guest.swipedIds.length > 0) {
      setMessage(DISCOVER_MESSAGES.refreshingSeen);
      clearSwipedIds();
      batch = await fetchFirstAvailableBatch(candidatePages, preferences, true);
    }

    if (batch.cards.length === 0) {
      setMessage(
        hasHardFilters(preferences)
          ? DISCOVER_MESSAGES.specificFilters
          : DISCOVER_MESSAGES.tryingBatch
      );
    }

    setCards(batch.cards);
    setPage(batch.lastFetchedPage);
    setLoading(false);
  }, [fetchFirstAvailableBatch, page, preferences]);

  async function loadMore(randomize = false) {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    const nextPage = randomize ? randomDiscoverPage() : page + 1;
    try {
      const newCards = await fetchBatch(nextPage, preferences);
      setPage(normalizeDiscoverPage(nextPage + 2));
      setCards((prev) => {
        const seen = new Set(prev.map((card) => card.id));
        const uniqueNewCards = newCards.filter((card) => {
          if (seen.has(card.id)) return false;
          seen.add(card.id);
          return true;
        });
        return [...prev, ...uniqueNewCards];
      });
    } finally {
      isLoadingMoreRef.current = false;
    }
  }

  async function handleModeChange(nextMode: DiscoverMode) {
    if (nextMode === preferences.discoverMode) return;

    const nextPreferences = {
      ...preferences,
      discoverMode: nextMode,
    };
    setPreferences(nextPreferences);
    setCards([]);
    setLastSwipe(null);
    setPage(1);
    setMessage(findingMessage(nextMode));
    savePreferences({ discoverMode: nextMode });

    const userId = await getCurrentUserId();
    if (userId) {
      await upsertPreferences({ discoverMode: nextMode });
    }
  }

  function openTrailerDialog(movieSelection: {
    id: number;
    mediaType: "movie" | "tv";
    preview: MovieCardData;
    initialInteraction?: { liked: boolean };
  }) {
    if (!modalHistoryPushed.current) {
      window.history.pushState({ cindrTrailer: true }, "", window.location.href);
      modalHistoryPushed.current = true;
    }
    setSelectedMovie(movieSelection);
  }

  function handleSwipeStart(id: number, direction: "left" | "right") {
    addSwipedId(id);
    const card = cards.find((c) => c.id === id);
    if (card) {
      setLastSwipe({ card, direction });
    }
    if (direction === "right" && card) {
      const mediaType = card.media_type ?? "movie";
      openTrailerDialog({
        id,
        mediaType,
        preview: card,
        initialInteraction: { liked: true },
      });
      void (async () => {
        const userId = await getCurrentUserId();
        if (!userId) {
          queuePendingInteraction({
            tmdb_id: id,
            media_type: mediaType,
            title: card.title,
            poster_path: card.posterPath ?? null,
            patch: { liked: true },
          });
          return;
        }
        await likeMovie({
          tmdb_id: id,
          media_type: mediaType,
          title: card.title,
          poster_path: card.posterPath ?? null,
        });
      })();
    }
  }

  function handleSwipe(id: number) {
    setSwipeRequest(undefined);
    setCards((prev) => prev.filter((c) => c.id !== id));

    const remainingCards = cards.length - 1;
    if (remainingCards <= 0) {
      void reshuffleDeck();
    } else if (remainingCards <= PREFETCH_CARD_THRESHOLD) {
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
    prewarmTrailers(
      cards.slice(0, PREWARM_CARD_COUNT).map((card) => ({
        tmdbId: card.id,
        mediaType: card.media_type ?? "movie",
      }))
    );
  }, [cards]);

  useEffect(() => {
    function handlePopState() {
      if (!modalHistoryPushed.current) return;
      modalHistoryPushed.current = false;
      setSelectedMovie(null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function closeTrailerDialog() {
    if (modalHistoryPushed.current) {
      modalHistoryPushed.current = false;
      setSelectedMovie(null);
      window.history.back();
      return;
    }
    setSelectedMovie(null);
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
        <div className="group mb-2 flex w-full max-w-[440px] flex-col items-center">
          <div className="grid w-40 grid-cols-2 rounded-full border border-white/10 bg-[#111015]/72 p-0.5 shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur-md">
            {(["taste", "random"] as DiscoverMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => void handleModeChange(mode)}
                disabled={!preferencesReady || loading}
                title={
                  mode === "random"
                    ? "Random ignores taste signals but keeps explicit hard filters."
                    : "Taste uses your saved preferences and advanced filters."
                }
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold capitalize tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  preferences.discoverMode === mode
                    ? "bg-[var(--color-cindr)] text-white shadow-[0_0_18px_rgba(216,90,48,0.28)]"
                    : "text-white/48 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="mt-1 max-w-[17rem] rounded-full border border-white/10 bg-black/30 px-3 py-1 text-center text-[10px] leading-relaxed text-white/45 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            {preferences.discoverMode === "random"
              ? "Random skips taste, keeps explicit filters."
              : "Taste follows preferences first."}
          </p>
        </div>
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
              className="w-full max-w-[440px]"
            >
              <SwipeDeck
                cards={cards}
                onSwipeStart={handleSwipeStart}
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
          key={`${selectedMovie.mediaType}-${selectedMovie.id}`}
          movieId={selectedMovie.id}
          mediaType={selectedMovie.mediaType}
          preview={selectedMovie.preview}
          initialInteraction={selectedMovie.initialInteraction}
          onClose={closeTrailerDialog}
        />
      )}
    </div>
  );
}
