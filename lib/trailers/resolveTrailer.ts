import type { Movie, Video } from "@/types/movie";

export type MediaType = "movie" | "tv";
export type TrailerSource = "tmdb" | "youtube" | "none";
export type TrailerStatus = "ready" | "no_trailer" | "error";

export type MediaTrailerRegistryRow = {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  release_year: number | null;
  youtube_key: string | null;
  youtube_url?: string | null;
  source: TrailerSource;
  status: TrailerStatus;
  resolved_at: string;
  last_checked_at: string;
  last_error: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TrailerPayload = {
  status: TrailerStatus;
  youtubeKey: string | null;
  source: TrailerSource;
  title: string;
  releaseYear: number | null;
};

type TrailerResolution = TrailerPayload & {
  lastError?: string | null;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

const REJECT_TERMS = [
  "reaction",
  "review",
  "breakdown",
  "explained",
  "fan made",
  "fanmade",
  "clip",
  "song",
  "music video",
  "behind the scenes",
  "ending",
  "recap",
  "analysis",
  "honest trailer",
];

const OFFICIAL_CHANNEL_HINTS = [
  "movieclips trailers",
  "netflix",
  "prime video",
  "hbo",
  "max",
  "disney",
  "marvel",
  "warner bros",
  "paramount",
  "universal pictures",
  "sony pictures",
  "lionsgate",
  "20th century",
  "a24",
  "searchlight pictures",
  "focus features",
  "apple tv",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "movie",
  "film",
  "series",
  "season",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTitleWords(title: string): string[] {
  return normalizeText(title)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function getReleaseYear(movie: Movie): number | null {
  const year = Number(movie.release_date?.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function selectBestTmdbTrailer(movie: Movie): Video | null {
  const videos = movie.videos?.results ?? [];
  const officialTrailers = videos.filter(
    (video) =>
      video.site === "YouTube" &&
      video.type === "Trailer" &&
      video.official &&
      Boolean(video.key)
  );

  return officialTrailers[0] ?? null;
}

function scoreYouTubeResult(
  item: YouTubeSearchItem,
  title: string,
  year: number | null
): number {
  const videoId = item.id?.videoId;
  const snippet = item.snippet;
  if (!videoId || !snippet?.title) return 0;

  const normalizedVideoTitle = normalizeText(snippet.title);
  const normalizedDescription = normalizeText(snippet.description ?? "");
  const normalizedChannel = normalizeText(snippet.channelTitle ?? "");
  const searchableText = `${normalizedVideoTitle} ${normalizedDescription}`;

  if (!normalizedVideoTitle.includes("trailer")) return 0;
  if (REJECT_TERMS.some((term) => searchableText.includes(term))) return 0;

  const titleWords = getTitleWords(title);
  const matchedWords = titleWords.filter((word) =>
    normalizedVideoTitle.includes(word)
  );
  const wordRatio =
    titleWords.length === 0 ? 0 : matchedWords.length / titleWords.length;

  if (titleWords.length > 0 && wordRatio < 0.6) return 0;

  let score = 20;
  if (normalizedVideoTitle.includes("official trailer")) score += 35;
  if (normalizedVideoTitle.includes("official")) score += 10;
  if (normalizeText(title) && normalizedVideoTitle.includes(normalizeText(title))) {
    score += 20;
  }
  if (year && searchableText.includes(String(year))) score += 8;
  if (OFFICIAL_CHANNEL_HINTS.some((hint) => normalizedChannel.includes(hint))) {
    score += 12;
  }
  score += Math.round(wordRatio * 40);

  return score;
}

async function searchYouTubeTrailer(
  title: string,
  year: number | null
): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("q", `${title} ${year ?? ""} official trailer`.trim());

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `YouTube trailer search failed: ${response.status} ${response.statusText} ${body}`
    );
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const scored = (data.items ?? [])
    .map((item) => ({
      item,
      score: scoreYouTubeResult(item, title, year),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  return best && best.score >= 70 ? best.item.id?.videoId ?? null : null;
}

export async function resolveTrailer(movie: Movie): Promise<TrailerResolution> {
  const title = movie.title;
  const releaseYear = getReleaseYear(movie);
  const tmdbTrailer = selectBestTmdbTrailer(movie);

  if (tmdbTrailer) {
    return {
      status: "ready",
      youtubeKey: tmdbTrailer.key,
      source: "tmdb",
      title,
      releaseYear,
      lastError: null,
    };
  }

  try {
    const youtubeKey = await searchYouTubeTrailer(title, releaseYear);
    if (youtubeKey) {
      return {
        status: "ready",
        youtubeKey,
        source: "youtube",
        title,
        releaseYear,
        lastError: null,
      };
    }

    return {
      status: "no_trailer",
      youtubeKey: null,
      source: "none",
      title,
      releaseYear,
      lastError: null,
    };
  } catch (error) {
    const lastError =
      error instanceof Error ? error.message : "Unknown trailer resolution error";
    console.error("Trailer resolution error:", error);
    return {
      status: "error",
      youtubeKey: null,
      source: "none",
      title,
      releaseYear,
      lastError,
    };
  }
}

export function toTrailerPayload(row: MediaTrailerRegistryRow): TrailerPayload {
  return {
    status: row.status,
    youtubeKey: row.youtube_key,
    source: row.source,
    title: row.title,
    releaseYear: row.release_year,
  };
}
