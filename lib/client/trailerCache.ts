import type { Movie } from "@/types/movie";

export type TrailerCacheMediaType = "movie" | "tv";

export type TrailerLookupResponse = {
  status: "ready" | "no_trailer" | "error";
  youtubeKey: string | null;
  source: "tmdb" | "youtube" | "none";
  title: string;
  releaseYear: number | null;
};

const trailerCache = new Map<string, TrailerLookupResponse>();
const trailerInflight = new Map<string, Promise<TrailerLookupResponse>>();
const detailsCache = new Map<string, Movie>();
const detailsInflight = new Map<string, Promise<Movie>>();

function cacheKey(mediaType: TrailerCacheMediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

export function getCachedTrailer(
  mediaType: TrailerCacheMediaType,
  tmdbId: number
): TrailerLookupResponse | null {
  return trailerCache.get(cacheKey(mediaType, tmdbId)) ?? null;
}

export function hasTrailerLookup(
  mediaType: TrailerCacheMediaType,
  tmdbId: number
): boolean {
  const key = cacheKey(mediaType, tmdbId);
  return trailerCache.has(key) || trailerInflight.has(key);
}

export async function fetchTrailerCached(
  mediaType: TrailerCacheMediaType,
  tmdbId: number
): Promise<TrailerLookupResponse> {
  const key = cacheKey(mediaType, tmdbId);
  const cached = trailerCache.get(key);
  if (cached) return cached;

  const existingRequest = trailerInflight.get(key);
  if (existingRequest) return existingRequest;

  const request = fetch(`/api/trailers/${tmdbId}?type=${mediaType}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("Trailer lookup failed");
      const trailerData = (await res.json()) as TrailerLookupResponse;
      trailerCache.set(key, trailerData);
      return trailerData;
    })
    .finally(() => {
      trailerInflight.delete(key);
    });

  trailerInflight.set(key, request);
  return request;
}

export function prewarmTrailers(
  items: Array<{ mediaType: TrailerCacheMediaType; tmdbId: number }>
): void {
  items.forEach(({ mediaType, tmdbId }) => {
    if (hasTrailerLookup(mediaType, tmdbId)) return;
    void fetchTrailerCached(mediaType, tmdbId).catch((error) => {
      console.warn("Trailer warmup failed:", error);
    });
  });
}

export function getCachedMovieDetails(
  mediaType: TrailerCacheMediaType,
  tmdbId: number
): Movie | null {
  return detailsCache.get(cacheKey(mediaType, tmdbId)) ?? null;
}

export async function fetchMovieDetailsCached(
  mediaType: TrailerCacheMediaType,
  tmdbId: number
): Promise<Movie> {
  const key = cacheKey(mediaType, tmdbId);
  const cached = detailsCache.get(key);
  if (cached) return cached;

  const existingRequest = detailsInflight.get(key);
  if (existingRequest) return existingRequest;

  const typeParam = mediaType === "tv" ? "?type=tv" : "";
  const request = fetch(`/api/tmdb/movie/${tmdbId}${typeParam}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("Movie details lookup failed");
      const movie = (await res.json()) as Movie;
      detailsCache.set(key, movie);
      return movie;
    })
    .finally(() => {
      detailsInflight.delete(key);
    });

  detailsInflight.set(key, request);
  return request;
}
