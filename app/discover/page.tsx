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
  addLikedId,
  getLikedIds,
} from "@/lib/guest/storage";
import {
  getCurrentUserId,
  getEffectivePreferences,
  likeMovie,
  patchMovieInteraction,
  upsertPreferences,
  getLikedTmdbIds,
  saveTasteFingerprint,
  loadTasteFingerprint,
} from "@/lib/supabase/core";
import type { Movie, MovieCardData } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import type { DiscoverMode, UserPreferences } from "@/types/user";
import SwipeDeck from "@/components/discover/SwipeDeck";
import TrailerDialog from "@/components/discover/TrailerDialog";
import AppHeader from "@/components/layout/AppHeader";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { prewarmTrailers } from "@/lib/client/trailerCache";
import {
  loadTasteProfile,
  saveTasteProfile,
  updateTasteProfile,
  updateProfileKeywords,
  topGenreIds,
  dislikedGenreIds,
  explorationGenreId,
  hasSignal,
  hydrateTasteProfile,
  type TasteProfile,
} from "@/lib/recommendations/tasteProfile";
import { rerankCards } from "@/lib/recommendations/cindrScore";

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
    tmdbPopularity: movie.popularity,
    voteCount: movie.vote_count,
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
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-out_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
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

const MODE_HINTS: Record<DiscoverMode, string> = {
  taste: "Follows your preferences first.",
  random: "Skips taste signals, keeps hard filters.",
};

function ModeToggle({
  mode,
  disabled,
  onChange,
}: {
  mode: DiscoverMode;
  disabled: boolean;
  onChange: (m: DiscoverMode) => void;
}) {
  const [hovered, setHovered] = useState<DiscoverMode | null>(null);

  return (
    <div className="mb-3 flex w-full max-w-[440px] shrink-0 flex-col items-center pt-1">
      <div className="grid min-h-8 w-40 grid-cols-2 rounded-full border border-white/10 bg-[#111015]/72 p-0.5 shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur-md">
        {(["taste", "random"] as DiscoverMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            disabled={disabled}
            onMouseEnter={() => setHovered(m)}
            onMouseLeave={() => setHovered(null)}
            className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold capitalize leading-none tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              mode === m
                ? "bg-[var(--color-cindr)] text-white shadow-[0_12px_30px_rgba(216,90,48,0.16)]"
                : "text-white/48 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="mt-1 h-6">
        {hovered && (
          <p className="max-w-[17rem] rounded-full border border-white/10 bg-black/30 px-3 py-1 text-center text-[10px] leading-relaxed text-white/45">
            {MODE_HINTS[hovered]}
          </p>
        )}
      </div>
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
  const emptyRetryCount = useRef(0);
  const tasteProfileRef = useRef<TasteProfile>(loadTasteProfile());
  const fetchCountRef = useRef(0);
  const likedIdsRef = useRef<Set<number>>(new Set(getLikedIds()));
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
      const eraValues = activePreferences.era.split(",").filter(Boolean);
      if (mode === "taste" && eraValues.length > 0 && !eraValues.includes("any")) {
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

      // Inject taste profile signals when in taste mode and we have enough data
      if (mode === "taste") {
        const profile = tasteProfileRef.current;
        if (hasSignal(profile)) {
          fetchCountRef.current += 1;
          const exploreId = explorationGenreId(profile, fetchCountRef.current);
          const learnedIds = exploreId ? [exploreId] : topGenreIds(profile, 3);
          const excludeIds = dislikedGenreIds(profile);
          if (learnedIds.length > 0) params.set("learnedGenres", learnedIds.join(","));
          if (excludeIds.length > 0) params.set("excludeGenres", excludeIds.join(","));
          if (profile.voteFloor > 4.5) params.set("voteFloor", profile.voteFloor.toFixed(1));
        }
      }

      const res = await fetch(`/api/tmdb/discover?${params.toString()}`, {
        signal,
      });
      const data = await res.json();

      if (data.results) {
        const swiped = new Set(ignoreSwiped ? [] : guest.swipedIds);
        const liked = likedIdsRef.current;
        const newCards = (data.results as Movie[])
          .filter((m) => !swiped.has(m.id) && !liked.has(m.id) && m.poster_path)
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
      const isTasteWithSignal =
        activePreferences.discoverMode === "taste" &&
        hasSignal(tasteProfileRef.current);

      // In taste mode with signal: 2 taste pages + 1 quality pool (no genre filter,
      // high vote_average) — fixes the "shallow puddle" problem.
      // In random mode or early sessions: 3 taste pages as before.
      const tastePages = isTasteWithSignal
        ? [startPage, startPage + 1].map(normalizeDiscoverPage)
        : [startPage, startPage + 1, startPage + 2].map(normalizeDiscoverPage);

      const tasteFetch = Promise.all(
        tastePages.map((p) => fetchMovies(p, activePreferences, ignoreSwiped, signal))
      );

      // Quality discovery pool — runs in parallel, only in taste mode
      const qualityFetch: Promise<MovieCardData[]> = isTasteWithSignal
        ? (async () => {
            try {
              const profile  = tasteProfileRef.current;
              const guest    = getGuestState();
              const qParams  = new URLSearchParams();
              qParams.set("mode", "taste");
              qParams.set("voteFloor", Math.max(profile.voteFloor, 7.0).toFixed(1));
              qParams.set("page", String(Math.floor(Math.random() * 12) + 1));
              if (activePreferences.contentTypes.length > 0)
                qParams.set("contentTypes", activePreferences.contentTypes.join(","));
              if (activePreferences.yearFrom)
                qParams.set("yearFrom", String(activePreferences.yearFrom));
              if (activePreferences.yearTo)
                qParams.set("yearTo", String(activePreferences.yearTo));
              // Deliberately no genres/moods — quality is the only filter
              const res = await fetch(`/api/tmdb/discover?${qParams}`, { signal });
              if (!res.ok) return [];
              const data = await res.json();
              const swiped = new Set(ignoreSwiped ? [] : guest.swipedIds);
              return (data.results as Movie[])
                .filter((m) => !swiped.has(m.id) && !likedIdsRef.current.has(m.id) && m.poster_path)
                .map(toCardData);
            } catch {
              return [];
            }
          })()
        : Promise.resolve([]);

      const [tasteBatches, qualityCards] = await Promise.all([tasteFetch, qualityFetch]);

      const seen = new Set<number>();
      const deduped = [...tasteBatches.flat(), ...qualityCards].filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });
      const shuffled = shuffleCards(deduped);
      return rerankCards(shuffled, tasteProfileRef.current, activePreferences.discoverMode);
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
      // Load preferences, liked IDs, and remote taste fingerprint in parallel
      const [{ preferences: effectivePreferences }, remoteIds, remoteFingerprint] =
        await Promise.all([
          getEffectivePreferences(),
          getLikedTmdbIds(),
          loadTasteFingerprint(),
        ]);
      if (cancelled) return;

      // Merge remote liked IDs into the local set
      if (remoteIds.length > 0) {
        remoteIds.forEach((id) => likedIdsRef.current.add(id));
      }

      // Use remote fingerprint if it has more swipes or is more recent
      if (remoteFingerprint) {
        const local = tasteProfileRef.current;
        if (
          remoteFingerprint.swipeCount > local.swipeCount ||
          remoteFingerprint.updatedAt > local.updatedAt
        ) {
          const hydrated = hydrateTasteProfile(remoteFingerprint);
          tasteProfileRef.current = hydrated;
          saveTasteProfile(hydrated);
        }
      }

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

    emptyRetryCount.current = 0;
    const nextPreferences = {
      ...preferences,
      discoverMode: nextMode,
    };
    setPreferences(nextPreferences);
    setLastSwipe(null);
    setPage(1);
    setMessage(findingMessage(nextMode));
    savePreferences({ discoverMode: nextMode });

    const userId = await getCurrentUserId();
    if (userId) {
      await upsertPreferences({ discoverMode: nextMode });
    }
  }

  const openTrailerDialog = useCallback((movieSelection: {
    id: number;
    mediaType: "movie" | "tv";
    preview: MovieCardData;
    initialInteraction?: { liked: boolean };
  }) => {
    if (!modalHistoryPushed.current) {
      window.history.pushState({ cindrTrailer: true }, "", window.location.href);
      modalHistoryPushed.current = true;
    }
    setSelectedMovie(movieSelection);
  }, []);

  function handleSwipeStart(id: number, direction: "left" | "right") {
    addSwipedId(id);
    const card = cards.find((c) => c.id === id);
    if (card) {
      setLastSwipe({ card, direction });
    }

    // Update taste profile on every swipe (like or skip)
    const liked = direction === "right";
    const updatedProfile = updateTasteProfile(
      tasteProfileRef.current,
      {
        genres:          card?.genres         ?? [],
        language:        card?.language       ?? "en",
        rating:          card?.rating         ?? 0,
        id,
        mediaType:       card?.media_type     ?? "movie",
        title:           card?.title          ?? "",
        year:            card?.year,
        tmdbPopularity:  card?.tmdbPopularity,
        voteCount:       card?.voteCount,
        runtime:         card?.runtime,
      },
      liked
    );
    tasteProfileRef.current = updatedProfile;
    saveTasteProfile(updatedProfile);
    // Persist to Supabase on likes (fire-and-forget)
    if (liked) {
      void saveTasteFingerprint(updatedProfile);
      // Background keyword enrichment — fetch TMDB keywords for liked movie
      // and update profile keyword weights async (never blocks the swipe)
      void (async () => {
        try {
          const mediaType = card?.media_type ?? "movie";
          const res = await fetch(`/api/tmdb/keywords?id=${id}&type=${mediaType}`);
          const data = await res.json();
          if (data.keywords?.length > 0) {
            const enriched = updateProfileKeywords(tasteProfileRef.current, data.keywords);
            tasteProfileRef.current = enriched;
            saveTasteProfile(enriched);
          }
        } catch {
          // non-critical — silent fail
        }
      })();
    }

    // Every 3rd like, inject TMDB recommendations — taste mode only
    if (direction === "right" && preferences.discoverMode === "taste" && updatedProfile.likeCount % 3 === 0 && updatedProfile.likeCount > 0) {
      const lastLiked = updatedProfile.recentLiked[0];
      if (lastLiked) {
        void (async () => {
          try {
            const res = await fetch(`/api/tmdb/similar?id=${lastLiked.id}&type=${lastLiked.mediaType}`);
            const data = await res.json();
            if (data.results?.length > 0) {
              const guest = getGuestState();
              const swiped = new Set(guest.swipedIds);
              const injected = (data.results as Movie[])
                .filter((m) => !swiped.has(m.id) && !likedIdsRef.current.has(m.id) && m.poster_path)
                .map((m) => ({ ...toCardData(m), becauseOf: lastLiked.title }))
                .slice(0, 3);
              if (injected.length > 0) {
                setCards((prev) => {
                  const existingIds = new Set(prev.map((c) => c.id));
                  const fresh = injected.filter((c) => !existingIds.has(c.id));
                  if (fresh.length === 0) return prev;
                  // Insert at position 4 so current card isn't disrupted
                  const insertAt = Math.min(4, prev.length);
                  return [...prev.slice(0, insertAt), ...fresh, ...prev.slice(insertAt)];
                });
              }
            }
          } catch {
            // non-critical — silent fail
          }
        })();
      }
    }

    if (direction === "right" && card) {
      // Permanently mark as liked so it never reappears in the feed
      likedIdsRef.current.add(id);
      addLikedId(id);
      const mediaType = card.media_type ?? "movie";
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

  const openCurrentTrailer = useCallback(() => {
    const topCard = cards[0];
    if (!topCard || selectedMovie) return;
    openTrailerDialog({
      id: topCard.id,
      mediaType: topCard.media_type ?? "movie",
      preview: topCard,
    });
  }, [cards, openTrailerDialog, selectedMovie]);

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
    if (cards.length > 0) {
      emptyRetryCount.current = 0;
    }
  }, [cards.length]);

  useEffect(() => {
    if (
      loading ||
      cards.length > 0 ||
      message === DISCOVER_MESSAGES.specificFilters
    ) {
      return;
    }
    if (emptyRetryCount.current >= 4) {
      return;
    }
    const retry = window.setTimeout(() => {
      emptyRetryCount.current += 1;
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
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        openCurrentTrailer();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cards, openCurrentTrailer, requestKeyboardSwipe, selectedMovie]);

  return (
    <div className="relative flex h-[100svh] min-h-[100svh] flex-col overflow-hidden md:h-[100dvh] md:min-h-[100dvh]">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center overflow-hidden px-3 pb-[env(safe-area-inset-bottom)] pt-[4.65rem] sm:px-4 md:pt-16">
        <ModeToggle
          mode={preferences.discoverMode}
          disabled={!preferencesReady}
          onChange={handleModeChange}
        />
        <AnimatePresence mode="wait">
          {cards.length > 0 ? (
            <motion.div
              key="deck"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 min-h-0 w-full"
            >
              <SwipeDeck
                cards={cards}
                onSwipeStart={handleSwipeStart}
                onSwipe={handleSwipe}
                swipeRequest={swipeRequest}
                onOpenTrailer={openCurrentTrailer}
                trailerOpen={!!selectedMovie}
                discoverMode={preferences.discoverMode}
                onUndo={undoLastSwipe}
                canUndo={!!lastSwipe && !selectedMovie}
              />
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <PosterSkeleton message={message} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
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
