"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Eye, Heart, Star } from "@phosphor-icons/react";
import type { Movie, MovieCardData, WatchProvider } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import {
  getSavedMovieForTitle,
  getCurrentUserId,
  patchMovieInteraction,
  rateMovie,
} from "@/lib/supabase/core";
import { queuePendingInteraction } from "@/lib/guest/storage";
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
  discoverMode?: "taste" | "random";
  preview?: MovieCardData;
  initialInteraction?: InteractionFlags;
  sourceList?: "liked" | "watchlisted" | "favourite" | "watched";
  onInteractionChange?: (interaction: SavedMovie) => void;
  onSwipeDecision?: (direction: "left" | "right") => void;
  onClose: () => void;
}

type TrailerStatus = "loading" | "ready" | "no_trailer" | "error";
type InteractionFlags = Partial<
  Pick<SavedMovie, "liked" | "watchlisted" | "favourite" | "watched" | "rating">
>;

function OverviewText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 2);
  }, [text]);

  return (
    <div className="mb-4">
      <p
        ref={ref}
        className={`text-sm leading-relaxed text-[var(--muted)] ${
          expanded
            ? ""
            : "max-h-[4.5rem] overflow-y-auto overscroll-contain pr-1"
        }`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-[var(--color-cindr)] hover:underline"
        >
          {expanded ? "Show less" : "More"}
        </button>
      )}
    </div>
  );
}

export default function TrailerDialog({
  movieId,
  mediaType = "movie",
  discoverMode = "taste",
  preview,
  initialInteraction,
  onInteractionChange,
  onSwipeDecision,
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
  const dragX = useMotionValue(0);
  const leftGlow = useTransform(dragX, [-180, -36], [0.28, 0]);
  const rightGlow = useTransform(dragX, [36, 180], [0, 0.28]);

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
      queuePendingInteraction({
        tmdb_id: movieId,
        media_type: mediaType,
        title: displayTitle,
        poster_path: displayPosterPath,
        patch: { rating: nextRating },
      });
      router.push("/auth/signup?returnTo=/discover");
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
      queuePendingInteraction({
        tmdb_id: movieId,
        media_type: mediaType,
        title: displayTitle,
        poster_path: displayPosterPath,
        patch,
      });
      setOptimisticInteraction({ ...(activeInteraction ?? {}), ...patch });
      router.push(
        patch.watchlisted ? "/auth/signup?returnTo=/watchlist" : "/auth/signup?returnTo=/discover"
      );
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

  function handlePanelDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!onSwipeDecision) return;
    if (Math.abs(info.offset.x) < 120) return;
    onSwipeDecision(info.offset.x > 0 ? "right" : "left");
  }

  const decisionDragProps = onSwipeDecision
    ? {
        drag: "x" as const,
        style: { x: dragX },
        dragConstraints: { left: 0, right: 0 },
        dragElastic: 0.18,
        onDragEnd: handlePanelDragEnd,
        whileDrag: { scale: 0.992 },
      }
    : {};

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/82 backdrop-blur-sm" onClick={onClose} />
        <CinematicBackdrop density="subtle" mode={discoverMode} />
        {onSwipeDecision && (
          <>
            <motion.div
              className="pointer-events-none fixed inset-0 z-10"
              style={{
                opacity: leftGlow,
                background:
                  "linear-gradient(to right, rgba(239,68,68,0.55) 0%, rgba(239,68,68,0.12) 35%, transparent 68%)",
              }}
            />
            <motion.div
              className="pointer-events-none fixed inset-0 z-10"
              style={{
                opacity: rightGlow,
                background:
                  "linear-gradient(to left, rgba(216,90,48,0.55) 0%, rgba(216,90,48,0.12) 35%, transparent 68%)",
              }}
            />
          </>
        )}

        <div className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
          {movie || preview ? (
            <motion.div
              {...decisionDragProps}
              className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.section
                className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              >
                <div className="relative aspect-video w-full bg-black">
                  {trailerKey ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                      title={`${displayTitle} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : previewImage ? (
                    <>
                      <Image
                        src={previewImage}
                        alt={displayTitle}
                        fill
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-black/55 px-4 py-2 text-sm text-white/68">
                          {trailerMessage}
                        </span>
                      </div>
                    </>
                  ) : loading || trailerStatus === "loading" ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-cindr)] border-t-transparent animate-spin" />
                    </div>
                  ) : null}
                </div>
              </motion.section>

              <motion.section
                className="relative max-h-[calc(100svh-2.5rem)] overflow-y-auto rounded-[1.75rem] border border-white/14 bg-[#15131b]/72 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-2xl sm:p-6"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%,rgba(255,255,255,0.025))]" />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_42px_rgba(255,255,255,0.025)]" />
                <div className="relative z-10">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight tracking-[-0.035em] text-white">
                      {displayTitle}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      {displayYear && <span>{displayYear}</span>}
                      {mediaType === "tv" && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-[var(--color-cindr)]">TV Series</span>
                        </>
                      )}
                      {movie?.runtime && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                          <span>{movie.runtime} min</span>
                        </>
                      )}
                      {displayRating && displayRating > 0 && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-yellow-400">{displayRating}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleShare} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10" aria-label="Share">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 10.8l6.8-4.6M8.6 13.2l6.8 4.6" />
                      </svg>
                    </button>
                    <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10" aria-label="Close">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {shareMessage && <p className="-mt-2 mb-3 text-xs text-[var(--color-cindr)]">{shareMessage}</p>}

                {movie?.genres && movie.genres.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {movie.genres.map((g) => (
                      <span key={g.id} className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[10px] font-medium text-white/70">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {displayOverview && <OverviewText text={displayOverview} />}

                <div className="mb-4 grid grid-cols-3 gap-2">
                  <button disabled={saving} onClick={() => patchCurrentInteraction({ favourite: !activeInteraction?.favourite })} aria-label={activeInteraction?.favourite ? "Remove favourite" : "Add favourite"} className={`grid h-12 place-items-center rounded-xl border transition-colors disabled:opacity-50 ${activeInteraction?.favourite ? "border-red-400/55 bg-red-500/14 text-red-200" : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"}`}>
                    <Star size={20} weight={activeInteraction?.favourite ? "fill" : "regular"} />
                  </button>
                  <button disabled={saving} onClick={() => patchCurrentInteraction({ watched: !activeInteraction?.watched, watchlisted: activeInteraction?.watched ? activeInteraction.watchlisted : false })} aria-label={activeInteraction?.watched ? "Mark as unwatched" : "Mark as watched"} className={`grid h-12 place-items-center rounded-xl border transition-colors disabled:opacity-50 ${activeInteraction?.watched ? "border-red-400/55 bg-red-500/14 text-red-200" : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"}`}>
                    <Eye size={20} weight={activeInteraction?.watched ? "fill" : "regular"} />
                  </button>
                  <button disabled={saving} onClick={() => patchCurrentInteraction({ liked: !activeInteraction?.liked })} aria-label={activeInteraction?.liked ? "Unlike" : "Like"} className={`grid h-12 place-items-center rounded-xl border transition-colors disabled:opacity-50 ${activeInteraction?.liked ? "border-red-400/55 bg-red-500/14 text-red-200" : "border-[var(--border-color)] text-white/75 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"}`}>
                    <Heart size={20} weight={activeInteraction?.liked ? "fill" : "regular"} />
                  </button>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Your Cindr rating</h3>
                    <span className="text-xs text-[var(--muted)]">{ratingSaving ? "Saving..." : rating ? `${rating}/10` : "Pick 1-10"}</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                      <button key={value} onClick={() => handleRating(value)} className={`h-9 rounded-lg text-xs font-semibold transition-colors ${rating === value ? "bg-[var(--color-cindr)] text-white" : "bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white"}`} aria-label={`Rate ${displayTitle} ${value} out of 10`}>
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {displayProviders.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Where to watch</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayProviders.slice(0, 6).map((p: WatchProvider) => (
                        <a key={p.provider_id} href={getProviderSearchUrl(p.provider_name)} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white/5 px-3 transition-colors hover:border-[var(--color-cindr)]/45 hover:bg-white/10">
                          <Image src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} width={20} height={20} className="rounded" />
                          <span className="text-xs">{p.provider_name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </motion.section>
            </motion.div>
          ) : (
            <div className="mx-auto rounded-2xl border border-white/10 bg-[#111015]/90 px-5 py-16 text-center text-sm text-[var(--muted)]">
              Could not load details.
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
