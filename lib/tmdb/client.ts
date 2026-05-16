import type { TMDBDiscoverResponse, Movie, Genre } from "@/types/movie";

const TMDB_BASE = "https://api.themoviedb.org/3";

function getAuth(): { type: "key"; value: string } | { type: "token"; value: string } {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (token) return { type: "token", value: token };

  const key = process.env.TMDB_API_KEY;
  if (key) return { type: "key", value: key };

  throw new Error("TMDB_API_KEY or TMDB_READ_ACCESS_TOKEN must be set");
}

export async function tmdbFetch<T>(
  path: string,
  params?: URLSearchParams
): Promise<T> {
  const auth = getAuth();
  const url = new URL(`${TMDB_BASE}${path}`);

  if (auth.type === "key") {
    url.searchParams.set("api_key", auth.value);
  }

  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth.type === "token") {
    headers["Authorization"] = `Bearer ${auth.value}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `TMDB request failed: ${res.status} ${res.statusText} — ${body}`
    );
  }
  return res.json() as Promise<T>;
}

export async function discoverMovies(
  params: URLSearchParams
): Promise<TMDBDiscoverResponse> {
  return tmdbFetch<TMDBDiscoverResponse>("/discover/movie", params);
}

export async function discoverTV(
  params: URLSearchParams
): Promise<TMDBDiscoverResponse> {
  const raw = await tmdbFetch<{
    page: number;
    results: Array<{
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string | null;
      backdrop_path: string | null;
      first_air_date: string;
      genre_ids: number[];
      vote_average: number;
      vote_count: number;
      original_language: string;
      popularity: number;
    }>;
    total_pages: number;
    total_results: number;
  }>("/discover/tv", params);

  return {
    page: raw.page,
    total_pages: raw.total_pages,
    total_results: raw.total_results,
    results: raw.results.map((tv) => ({
      id: tv.id,
      title: tv.name,
      original_title: tv.original_name,
      overview: tv.overview,
      poster_path: tv.poster_path,
      backdrop_path: tv.backdrop_path,
      release_date: tv.first_air_date ?? "",
      genre_ids: tv.genre_ids,
      vote_average: tv.vote_average,
      vote_count: tv.vote_count,
      original_language: tv.original_language,
      popularity: tv.popularity,
      adult: false,
      media_type: "tv" as const,
    })),
  };
}

export async function getMovieDetails(id: number): Promise<Movie> {
  return tmdbFetch<Movie>(
    `/movie/${id}`,
    new URLSearchParams({
      append_to_response: "videos,watch/providers",
    })
  );
}

export async function getTVDetails(id: number): Promise<Movie> {
  const raw = await tmdbFetch<Record<string, unknown>>(
    `/tv/${id}`,
    new URLSearchParams({
      append_to_response: "videos,watch/providers",
    })
  );

  return {
    id: raw.id as number,
    title: (raw.name as string) ?? "",
    original_title: (raw.original_name as string) ?? "",
    overview: (raw.overview as string) ?? "",
    poster_path: raw.poster_path as string | null,
    backdrop_path: raw.backdrop_path as string | null,
    release_date: (raw.first_air_date as string) ?? "",
    genre_ids: (raw.genre_ids as number[]) ?? [],
    genres: raw.genres as Movie["genres"],
    vote_average: (raw.vote_average as number) ?? 0,
    vote_count: (raw.vote_count as number) ?? 0,
    original_language: (raw.original_language as string) ?? "",
    popularity: (raw.popularity as number) ?? 0,
    adult: false,
    runtime: (raw.episode_run_time as number[])?.at(0),
    videos: raw.videos as Movie["videos"],
    watch_providers: raw["watch/providers"] as Movie["watch_providers"],
    media_type: "tv",
  };
}

export async function getGenres(): Promise<{ genres: Genre[] }> {
  return tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
}
