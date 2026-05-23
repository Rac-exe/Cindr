export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  vote_average: number;
  vote_count: number;
  original_language: string;
  popularity: number;
  adult: boolean;
  runtime?: number;
  videos?: { results: Video[] };
  watch_providers?: WatchProviderResult;
  media_type?: "movie" | "tv";
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1?: string;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderResult {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: WatchProvider[];
      rent?: WatchProvider[];
      buy?: WatchProvider[];
    }
  >;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MovieCardData {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  posterPath?: string | null;
  year: string;
  rating: number;
  genres: string[];
  language: string;
  runtime?: number;
  media_type?: "movie" | "tv";
  /** Set on TMDB-recommendation-injected cards */
  becauseOf?: string;
  /** CindrSense fields — populated after scoring */
  isSuperMatch?: boolean;
  isDiscovery?: boolean;
  cindrScore?: number;
  /** Raw TMDB signals — used by the scoring engine */
  tmdbPopularity?: number;
  voteCount?: number;
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(
  path: string | null,
  size = "w1280"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
