"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Movie, Video, WatchProvider } from "@/types/movie";
import { posterUrl } from "@/types/movie";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

interface TrailerDialogProps {
  movieId: number;
  mediaType?: "movie" | "tv";
  onClose: () => void;
}

export default function TrailerDialog({ movieId, mediaType = "movie", onClose }: TrailerDialogProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const typeParam = mediaType === "tv" ? "?type=tv" : "";
        const res = await fetch(`/api/tmdb/movie/${movieId}${typeParam}`);
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        console.error("Failed to fetch details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId, mediaType]);

  const trailer = movie?.videos?.results?.find(
    (v: Video) =>
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser") &&
      v.official
  ) ??
    movie?.videos?.results?.find(
      (v: Video) => v.site === "YouTube" && v.type === "Trailer"
    ) ??
    movie?.videos?.results?.find((v: Video) => v.site === "YouTube");

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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : movie ? (
            <>
              {trailer ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-t-2xl sm:rounded-t-2xl"
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                    title={trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : movie.poster_path ? (
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <img
                    src={posterUrl(movie.backdrop_path ?? movie.poster_path, "w1280") ?? ""}
                    alt={movie.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/60 text-sm bg-black/50 px-4 py-2 rounded-full">
                      No trailer available
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-xl font-bold leading-tight">
                      {movie.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                      <span>{movie.release_date?.slice(0, 4)}</span>
                      {mediaType === "tv" && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-[var(--color-cindr)]">TV Series</span>
                        </>
                      )}
                      {movie.runtime && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span>{movie.runtime} min</span>
                        </>
                      )}
                      {movie.vote_average > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                          <span className="text-yellow-400">
                            {Math.round(movie.vote_average * 10) / 10}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
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

                {movie.genres && movie.genres.length > 0 && (
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

                <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                  {movie.overview}
                </p>

                {uniqueProviders.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                      Where to watch
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {uniqueProviders.slice(0, 6).map((p: WatchProvider) => (
                        <div
                          key={p.provider_id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border-color)]"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                            alt={p.provider_name}
                            className="w-5 h-5 rounded"
                          />
                          <span className="text-xs">{p.provider_name}</span>
                        </div>
                      ))}
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
                  <button
                    onClick={() => {
                      alert("Sign up to save to your watchlist!");
                    }}
                    className="px-5 py-3 rounded-xl border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Save
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
