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

export async function getMovieDetails(id: number): Promise<Movie> {
  return tmdbFetch<Movie>(
    `/movie/${id}`,
    new URLSearchParams({
      append_to_response: "videos,watch/providers",
    })
  );
}

export async function getGenres(): Promise<{ genres: Genre[] }> {
  return tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
}
