/**
 * Taste Profile — learns from every swipe using exponential moving average.
 *
 * "Never stale" mechanism: ALL weights are multiplied by DECAY on every swipe,
 * so a preference from 30 swipes ago has less than 40% of its original influence.
 * The profile stays relevant as taste shifts over time.
 *
 * Exploration: every 7th batch, return a "stretch" genre (moderate positive weight)
 * instead of the top genre so the feed never becomes an echo chamber.
 */

const STORAGE_KEY = "cindr_taste_v1";

const LIKE_DELTA = 0.25;   // how much liking adds to a genre weight
const SKIP_DELTA = 0.12;   // how much skipping subtracts
const DECAY = 0.97;        // applied to ALL weights on every swipe
const MIN_SIGNAL = 5;      // swipes before we trust the profile
const MAX_RECENT = 8;      // recent liked IDs to track for TMDB recs

/** Map genre display names → TMDB IDs (matching GENRE_MAP in discover page) */
export const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
  "Action & Adventure": 10759,
  "Sci-Fi & Fantasy": 10765,
  Reality: 10764,
  "War & Politics": 10768,
};

export interface TasteProfile {
  /** genre name → learned weight in [-1, 1] */
  genreWeights: Record<string, number>;
  /** language code → affinity in [0, 1] */
  langWeights: Record<string, number>;
  /** minimum vote_average to show (drifts toward avg liked-movie rating) */
  voteFloor: number;
  swipeCount: number;
  likeCount: number;
  /** most recently liked movie IDs + titles for TMDB /recommendations injection */
  recentLiked: Array<{ id: number; mediaType: "movie" | "tv"; title: string }>;
  updatedAt: number;
}

function blank(): TasteProfile {
  return {
    genreWeights: {},
    langWeights: {},
    voteFloor: 5.5,
    swipeCount: 0,
    likeCount: 0,
    recentLiked: [],
    updatedAt: Date.now(),
  };
}

export function loadTasteProfile(): TasteProfile {
  if (typeof window === "undefined") return blank();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TasteProfile) : blank();
  } catch {
    return blank();
  }
}

export function saveTasteProfile(p: TasteProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // storage quota — non-fatal
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function updateTasteProfile(
  profile: TasteProfile,
  movie: {
    genres: string[];
    language: string;
    rating: number;
    id: number;
    mediaType: "movie" | "tv";
    title: string;
  },
  liked: boolean
): TasteProfile {
  const p: TasteProfile = {
    ...profile,
    genreWeights: { ...profile.genreWeights },
    langWeights: { ...profile.langWeights },
    recentLiked: [...profile.recentLiked],
  };

  // ── Decay all existing weights (the "never stale" core) ────────────────
  for (const k of Object.keys(p.genreWeights)) {
    p.genreWeights[k] *= DECAY;
  }
  for (const k of Object.keys(p.langWeights)) {
    p.langWeights[k] = p.langWeights[k] * DECAY + (1 - DECAY) * 0.5; // decays toward neutral
  }

  // ── Update genre weights ───────────────────────────────────────────────
  for (const genre of movie.genres) {
    const cur = p.genreWeights[genre] ?? 0;
    if (liked) {
      // Tapers as weight approaches +1 (avoids runaway dominance)
      p.genreWeights[genre] = clamp(cur + LIKE_DELTA * (1 - cur), -1, 1);
    } else {
      // Stronger impact when this genre had positive weight (punishes false positives)
      p.genreWeights[genre] = clamp(cur - SKIP_DELTA * (1 + cur) * 0.6, -1, 1);
    }
  }

  // ── Language affinity ─────────────────────────────────────────────────
  if (movie.language) {
    const cur = p.langWeights[movie.language] ?? 0.5;
    p.langWeights[movie.language] = clamp(
      liked ? cur + 0.07 : cur - 0.04,
      0,
      1
    );
  }

  // ── Vote floor — slow EMA toward 90 % of liked rating ─────────────────
  if (liked && movie.rating > 0) {
    const target = movie.rating * 0.88; // slightly below actual rating
    p.voteFloor = clamp(p.voteFloor * 0.93 + target * 0.07, 4.0, 7.5);
  }

  // ── Bookkeeping ───────────────────────────────────────────────────────
  p.swipeCount += 1;
  if (liked) {
    p.likeCount += 1;
    p.recentLiked = [
      { id: movie.id, mediaType: movie.mediaType, title: movie.title },
      ...p.recentLiked.filter((r) => r.id !== movie.id),
    ].slice(0, MAX_RECENT);
  }

  p.updatedAt = Date.now();
  return p;
}

/** True once we have enough swipes to generate meaningful signal */
export function hasSignal(p: TasteProfile): boolean {
  return p.swipeCount >= MIN_SIGNAL;
}

/** Top N genres by positive weight → TMDB IDs */
export function topGenreIds(p: TasteProfile, n = 3): number[] {
  return Object.entries(p.genreWeights)
    .filter(([, w]) => w > 0.08)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name]) => GENRE_NAME_TO_ID[name])
    .filter(Boolean) as number[];
}

/** Strongly disliked genre IDs (to exclude from queries) */
export function dislikedGenreIds(p: TasteProfile, threshold = -0.25): number[] {
  return Object.entries(p.genreWeights)
    .filter(([, w]) => w < threshold)
    .map(([name]) => GENRE_NAME_TO_ID[name])
    .filter(Boolean) as number[];
}

/**
 * Every 7th fetch, return a "stretch" genre ID — moderate positive weight
 * but not the dominant one — to keep the feed from becoming an echo chamber.
 */
export function explorationGenreId(p: TasteProfile, fetchCount: number): number | null {
  if (!hasSignal(p) || fetchCount % 7 !== 0) return null;
  const moderate = Object.entries(p.genreWeights)
    .filter(([, w]) => w > 0.05 && w < 0.45)
    .sort(() => Math.random() - 0.5);
  const name = moderate[0]?.[0];
  return name ? (GENRE_NAME_TO_ID[name] ?? null) : null;
}
