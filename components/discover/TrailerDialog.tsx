"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkSimple, Eye, Heart, Star } from "@phosphor-icons/react";
import type { Movie, MovieCardData, WatchProvider } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import {
  getSavedMovieForTitle,
  getCurrentUserId,
  patchMovieInteraction,
  rateMovie,
} from "@/lib/supabase/core";
import {
  fetchMovieDetailsCached,
  fetchTrailerCached,
  getCachedMovieDetails,
  getCachedTrailer,
} from "@/lib/client/trailerCache";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import type { SavedMovie } from "@/types/user";

interface TrailerDialogProps {
  movieId: number;
  mediaType?: "movie" | "tv";
  preview?: MovieCardData;
  initialInteraction?: InteractionFlags;
  sourceList?: "liked" | "watchlisted" | "favourite" | "watched";
  onInteractionChange?: (interaction: SavedMovie) => void;
  onClose: () => void;
}

type TrailerStatus = "loading" | "ready" | "no_trailer" | "error";
type InteractionFlags = Partial<
  Pick<SavedMovie, "liked" | "watchlisted" | "favourite" | "watched" | "rating">
>;

export default function TrailerDialog({
  movieId,
  mediaType = "movie",
  preview,
  initialInteraction,
  onInteractionChange,
  onClose,
}: TrailerDialogProps) {
  const router = useRouter();
  const cachedTrailer = getCachedTrailer(mediaType, movieId);
  const cachedMovie = getCachedMovieDetails(mediaType, movieId);
  const [movie, setMovie] = useState<Movie | null>(cachedMovie);
  const [loading, setLoading] = useState(!cachedMovie);
  const [saving, setSaving] = useState(false);
  const [interaction, setInteraction] = useState<SavedMovie | null>(null);
  const [optimisticInteraction, setOptimisticInteraction] =
    useState<InteractionFlags | null>(initialInteraction ?? null);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [trailerKey, setTrailerKey] = useState<string | null>(
    cachedTrailer?.youtubeKey ?? null
  );
  const [trailerStatus, setTrailerStatus] = useState<TrailerStatus>(
    cachedTrailer?.status ?? "loading"
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = getCachedTrailer(mediaType, movieId);
      setTrailerStatus(cached?.status ?? "loading");
      setTrailerKey(cached?.youtubeKey ?? null);

      try {
        const trailerData = await fetchTrailerCached(mediaType, movieId);
        if (cancelled) return;
        setTrailerKey(trailerData.youtubeKey ?? null);
        setTrailerStatus(trailerData.status);
      } catch (err) {
        console.error("Failed to fetch trailer:", err);
        if (!cancelled) setTrailerStatus("error");
      }
    })();

    (async () => {
      const cachedDetails = getCachedMovieDetails(mediaType, movieId);
      setLoading(!cachedDetails);
      setMovie(cachedDetails);
      setOptimisticInteraction(initialInteraction ?? null);

      try {
        const [movieDetails, existingInteraction] = await Promise.all([
          fetchMovieDetailsCached(mediaType, movieId),
          getSavedMovieForTitle(movieId, mediaType),
        ]);
        if (cancelled) return;
        setMovie(movieDetails);
        setInteraction(existingInteraction);
        setRating(existingInteraction?.rating ?? initialInteraction?.rating ?? null);
      } catch (err) {
        console.error("Failed to fetch details:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialInteraction, movieId, mediaType]);

  const displayTitle = movie?.title ?? preview?.title ?? "Cindr pick";
  const displayYear = movie?.release_date?.slice(0, 4) ?? preview?.year ?? "";
  const displayRating = movie?.vote_average
    ? Math.round(movie.vote_average * 10) / 10
    : preview?.rating;
  const displayOverview = movie?.overview ?? preview?.overview ?? "";
  const displayPosterPath = movie?.poster_path ?? preview?.posterPath ?? null;
  const previewImage =
    (movie?.backdrop_path || movie?.poster_path)
      ? posterUrl(movie.backdrop_path ?? movie.poster_path, "w1280")
      : preview?.posterUrl;
  const trailerMessage =
    trailerStatus === "loading"
      ? "Loading trailer..."
      : trailerStatus === "error"
        ? "Trailer unavailable right now"
        : "No trailer available";
  const activeInteraction = interaction ?? optimisticInteraction;

  async function handleShare() {
    const path = `/m/${mediaType}/${movieId}`;
    const url =
      typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    const title = `${displayTitle} on Cindr`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out ${displayTitle} on Cindr.`,
          url,
        });
        setShareMessage("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      }
      window.setTimeout(() => setShareMessage(""), 1800);
    } catch {
      setShareMessage("");
    }
  }

  async function handleRating(nextRating: number) {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.push("/auth/signup");
      return;
    }
    if (!displayTitle) return;

    setRating(nextRating);
    setRatingSaving(true);
    const nextInteraction = await rateMovie({
      tmdb_id: movieId,
      media_type: mediaType,
      title: displayTitle,
      poster_path: displayPosterPath,
      rating: nextRating,
    });
    setInteraction(nextInteraction);
    if (nextInteraction) onInteractionChange?.(nextInteraction);
    setRatingSaving(false);
  }

  async function patchCurrentInteraction(
    patch: Partial<
      Pick<SavedMovie, "liked" | "watchlisted" | "favourite" | "watched" | "rating">
    >
  ) {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.push("/auth/signup");
      return;
    }
    setSaving(true);
    setOptimisticInteraction({ ...(activeInteraction ?? {}), ...patch });
    const nextInteraction = await patchMovieInteraction(
      {
        tmdb_id: movieId,
        media_type: mediaType,
        title: displayTitle,
        poster_path: displayPosterPath,
      },
      patch
    );
    setInteraction(nextInteraction);
    if (nextInteraction) onInteractionChange?.(nextInteraction);
    if (patch.rating !== undefined) setRating(patch.rating);
    setSaving(false);
  }

  const wpData = (movie as unknown as Record<string, unknown>)?.["watch/providers"] as Movie["watch_providers"] | undefined;
  const wpFinal = wpData ?? movie?.watch_providers;
  const providers =
    wpFinal?.results?.["IN"] ??
    wpFinal?.results?.["US"];
  const flatrate = providers?.flatrate ?? [];
  const rent = providers?.rent ?? [];
  const buy = providers?.buy ?? [];
  const allProviders = [...flatrate, ...rent, ...buy];
  const uniqueProviders = allProviders.filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  );
  const displayProviders = uniqueProviders.reduce<WatchProvider[]>((acc, provider) => {
    const family = getProviderFamily(provider.provider_name);
    if (acc.some((item) => getProviderFamily(item.provider_name) === family)) {
      return acc;
    }
    acc.push({
      ...provider,
      provider_name: getProviderDisplayName(provider.provider_name),
    });
    return acc;
  }, []);

  function getProviderFamily(providerName: string): string {
    const lowerName = providerName.toLowerCase();
    if (lowerName.includes("amazon") && !lowerName.includes("bfi")) return "amazon";
    if (lowerName.includes("google play")) return "google-play";
    if (lowerName.includes("youtube")) return "youtube";
    if (lowerName.includes("apple")) return "apple";
    if (lowerName.includes("netflix")) return "netflix";
    if (lowerName.includes("hotstar") || lowerName.includes("disney")) return "disney-hotstar";
    return lowerName.replace(/\s+with ads/g, "").replace(/\s+channel/g, "");
  }

  function getProviderDisplayName(providerName: string): string {
    const lowerName = providerName.toLowerCase();
    if (lowerName.includes("amazon") && !lowerName.includes("bfi")) return "Amazon Prime Video";
    if (lowerName.includes("google play")) return "Google Play Movies";
    if (lowerName.includes("youtube")) return "YouTube";
    if (lowerName.includes("apple")) return "Apple TV";
    return providerName.replace(/\s+with Ads$/i, "");
  }

  function getProviderSearchUrl(providerName: string): string {
    const query = encodeURIComponent(displayTitle);
    const lowerName = providerName.toLowerCase();

    if (lowerName.includes("youtube")) {
      return `https://www.youtube.com/results?search_query=${query}`;
    }
    if (lowerName.includes("apple")) {
      return `https://tv.apple.com/search?term=${query}`;
    }
    if (lowerName.includes("google play")) {
      return `https://play.google.com/store/search?q=${query}&c=movies`;
    }
    if (lowerName.includes("prime")) {
      return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`;
    }
    if (lowerName.includes("netflix")) {
      return `https://www.netflix.com/search?q=${query}`;
    }
    if (lowerName.includes("hotstar") || lowerName.includes("disney")) {
      return `https://www.google.com/search?q=${query}+${encodeURIComponent(providerName)}`;
    }

    return `https://www.google.com/search?q=${query}+${encodeURIComponent(providerName)}`;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/82 backdrop-blur-sm"
          onClick={onClose}
        />
        <CinematicBackdrop density="subtle" />

        <motion.div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--surface)]/95 border border-white/15 shadow-[0_28px_100px_rgba(0,0,0,0.6)] backdrop-blur-md"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {movie || preview ? (
            <>
              {trailerKey ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-t-2xl sm:rounded-t-2xl"
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                    title={`${displayTitle} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : previewImage ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <Image
                    src={previewImage}
                    alt={displayTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, 512px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/60 text-sm bg-black/50 px-4 py-2 rounded-full">
                      {trailerMessage}
                    </span>
                  </div>
                </div>
              ) : loading || trailerStatus === "loading" ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : null}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-xl font-bold leading-tight">
                      {displayTitle}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                      {displayYear && <span>{displayYear}</span>}
                      {mediaType === "tv" && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-[var(--color-cindr)]">TV Series</span>
                        </>
                      )}
                      {movie?.runtime && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span>{movie.runtime} min</span>
                        </>
                      )}
                      {displayRating && displayRating > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-yellow-400">
                            {displayRating}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                      aria-label="Share"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 10.8l6.8-4.6M8.6 13.2l6.8 4.6" />
                      </svg>
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                      aria-label="Close"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {shareMessage && (
                  <p className="-mt-1 mb-3 text-xs text-[var(--color-cindr)]">
                    {shareMessage}
                  </p>
                )}

                {movie?.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {movie.genres.map((g) => (
                      <span
                        key={g.id}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/70"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
                {loading && !movie?.genres?.length && (
                  <div className="mb-3 flex gap-1.5" aria-label="Loading details">
                    <span className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
                    <span className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
                    <span className="h-6 w-12 animate-pulse rounded-full bg-white/10" />
                  </div>
                )}

                {displayOverview && (
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                    {displayOverview}
                  </p>
                )}

                <div className="mb-4 grid grid-cols-4 gap-2">
                  <button
                    disabled={saving}
                    onClick={() =>
                      patchCurrentInteraction({
                        watchlisted: !activeInteraction?.watchlisted,
                      })
                    }
                    aria-label={activeInteraction?.watchlisted ? "Remove from watchlist" : "Add to watchlist"}
                    title={activeInteraction?.watchlisted ? "Remove from watchlist" : "Add to watchlist"}
                    className={`grid h-12 w-full place-items-center rounded-xl border transition-colors disabled:opacity-50 ${
                      activeInteraction?.watchlisted
                        ? "border-red-400/60 bg-red-500/15 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.16)]"
                        : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
                    }`}
                  >
                    <BookmarkSimple
                      size={21}
                      weight={activeInteraction?.watchlisted ? "fill" : "regular"}
                    />
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      patchCurrentInteraction({
                        favourite: !activeInteraction?.favourite,
                      })
                    }
                    aria-label={activeInteraction?.favourite ? "Remove favourite" : "Add favourite"}
                    title={activeInteraction?.favourite ? "Remove favourite" : "Add favourite"}
                    className={`grid h-12 w-full place-items-center rounded-xl border transition-colors disabled:opacity-50 ${
                      activeInteraction?.favourite
                        ? "border-red-400/60 bg-red-500/15 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.16)]"
                        : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
                    }`}
                  >
                    <Star
                      size={21}
                      weight={activeInteraction?.favourite ? "fill" : "regular"}
                    />
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      patchCurrentInteraction({
                        watched: !activeInteraction?.watched,
                        watchlisted: activeInteraction?.watched
                          ? activeInteraction.watchlisted
                          : false,
                      })
                    }
                    aria-label={activeInteraction?.watched ? "Mark as unwatched" : "Mark as watched"}
                    title={activeInteraction?.watched ? "Mark as unwatched" : "Mark as watched"}
                    className={`grid h-12 w-full place-items-center rounded-xl border transition-colors disabled:opacity-50 ${
                      activeInteraction?.watched
                        ? "border-red-400/60 bg-red-500/15 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.16)]"
                        : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
                    }`}
                  >
                    <Eye
                      size={21}
                      weight={activeInteraction?.watched ? "fill" : "regular"}
                    />
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      patchCurrentInteraction({ liked: !activeInteraction?.liked })
                    }
                    aria-label={activeInteraction?.liked ? "Unlike" : "Like"}
                    title={activeInteraction?.liked ? "Unlike" : "Like"}
                    className={`grid h-12 w-full place-items-center rounded-xl border transition-colors disabled:opacity-50 ${
                      activeInteraction?.liked
                        ? "border-red-400/60 bg-red-500/15 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.16)]"
                        : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
                    }`}
                  >
                    <Heart
                      size={21}
                      weight={activeInteraction?.liked ? "fill" : "regular"}
                    />
                  </button>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Your Cindr rating
                    </h3>
                    <span className="text-xs text-[var(--muted)]">
                      {ratingSaving
                        ? "Saving..."
                        : rating
                          ? `${rating}/10`
                          : "Pick 1-10"}
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                      <button
                        key={value}
                        onClick={() => handleRating(value)}
                        className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                          rating === value
                            ? "bg-[var(--color-cindr)] text-white"
                            : "bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white"
                        }`}
                        aria-label={`Rate ${displayTitle} ${value} out of 10`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {displayProviders.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                      Where to watch
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayProviders.slice(0, 6).map((p: WatchProvider) => (
                        <a
                          key={p.provider_id}
                          href={getProviderSearchUrl(p.provider_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border-color)] transition-colors hover:border-[var(--color-cindr)]/45 hover:bg-white/10"
                        >
                          <Image
                            src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                            alt={p.provider_name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <span className="text-xs">{p.provider_name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {loading && displayProviders.length === 0 && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                    <div className="mt-3 flex gap-2">
                      <span className="h-8 w-20 animate-pulse rounded-lg bg-white/8" />
                      <span className="h-8 w-24 animate-pulse rounded-lg bg-white/8" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-[var(--color-cindr)] text-white text-sm font-medium hover:bg-[var(--color-cindr-hover)] transition-colors"
                  >
                    Keep swiping
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-sm text-[var(--muted)]">
              Could not load details.
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
