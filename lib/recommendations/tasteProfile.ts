/**
 * CindrSense Taste Profile
 *
 * Learns from every swipe using multi-dimensional exponential moving averages.
 *
 * Dimensions tracked beyond genres:
 *   - Tone/vibe   (dark, fun, emotional, tense, mind_bending, epic)
 *   - Era         (decade buckets)
 *   - Popularity bias  (hidden gems vs mainstream)
 *   - Runtime bias     (short vs long)
 *
 * "Never stale": all weights decay on every swipe so recent taste dominates.
 * Exploration injection: every 7th batch uses a stretch genre to prevent echo chambers.
 */

const STORAGE_KEY = "cindr_taste_v2";

const LIKE_DELTA = 0.25;
const SKIP_DELTA = 0.12;
const DECAY      = 0.97;
const MIN_SIGNAL = 5;
const MAX_RECENT = 8;

// ── Genre → TMDB ID map ────────────────────────────────────────────────────
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

// ── Tone/vibe dimensions ───────────────────────────────────────────────────
export interface ToneWeights {
  dark:        number;  // dark, gritty, intense
  fun:         number;  // light, comedy, feel-good
  emotional:   number;  // tearjerker, heartfelt
  tense:       number;  // thriller, suspense, horror
  mind_bending: number; // sci-fi, mystery, philosophical
  epic:        number;  // action, adventure, grand scope
}

/** How strongly each genre contributes to each tone dimension (0–1) */
export const GENRE_TONE_MAP: Partial<Record<string, Partial<ToneWeights>>> = {
  Action:            { epic: 1.0,  tense: 0.3 },
  Adventure:         { epic: 0.9,  fun: 0.3 },
  Animation:         { fun: 0.7,   mind_bending: 0.2 },
  Comedy:            { fun: 1.0 },
  Crime:             { dark: 0.8,  tense: 0.6 },
  Documentary:       { mind_bending: 0.6 },
  Drama:             { emotional: 0.8, dark: 0.3 },
  Family:            { fun: 0.8,   emotional: 0.3 },
  Fantasy:           { epic: 0.6,  mind_bending: 0.5 },
  History:           { emotional: 0.5, dark: 0.3, epic: 0.4 },
  Horror:            { dark: 1.0,  tense: 0.9 },
  Music:             { emotional: 0.7, fun: 0.3 },
  Mystery:           { tense: 0.7, mind_bending: 0.6 },
  Romance:           { emotional: 0.9, fun: 0.2 },
  "Sci-Fi":          { mind_bending: 0.9, epic: 0.4 },
  "Science Fiction": { mind_bending: 0.9, epic: 0.4 },
  Thriller:          { tense: 0.9, dark: 0.5 },
  War:               { dark: 0.8,  epic: 0.6, emotional: 0.4 },
  Western:           { epic: 0.5,  dark: 0.4 },
  "Action & Adventure": { epic: 0.9, tense: 0.3 },
  "Sci-Fi & Fantasy":   { mind_bending: 0.8, epic: 0.5 },
};

// ── Era buckets ────────────────────────────────────────────────────────────
export interface EraWeights {
  pre1980:  number;
  eighties: number;
  nineties: number;
  aughts:   number;  // 2000–2009
  tens:     number;  // 2010–2019
  recent:   number;  // 2020+
}

// ── Full profile ───────────────────────────────────────────────────────────
export interface TasteProfile {
  genreWeights:       Record<string, number>;
  langWeights:        Record<string, number>;
  toneWeights:        ToneWeights;
  eraWeights:         EraWeights;
  /** keyword name → affinity 0–1, built from liked movies' TMDB keywords */
  keywordWeights:     Record<string, number>;
  /** -1 = loves mainstream hits, +1 = loves hidden gems */
  popularityTierBias: number;
  /** -1 = prefers short films, +1 = prefers long films */
  runtimeBias:        number;
  voteFloor:          number;
  swipeCount:         number;
  likeCount:          number;
  recentLiked:        Array<{ id: number; mediaType: "movie" | "tv"; title: string; genres?: string[] }>;
  updatedAt:          number;
}

function blankTone(): ToneWeights {
  return { dark: 0, fun: 0, emotional: 0, tense: 0, mind_bending: 0, epic: 0 };
}

function blankEra(): EraWeights {
  return { pre1980: 0, eighties: 0, nineties: 0, aughts: 0, tens: 0, recent: 0 };
}

function blank(): TasteProfile {
  return {
    genreWeights:       {},
    langWeights:        {},
    toneWeights:        blankTone(),
    eraWeights:         blankEra(),
    keywordWeights:     {},
    popularityTierBias: 0,
    runtimeBias:        0,
    voteFloor:          5.5,
    swipeCount:         0,
    likeCount:          0,
    recentLiked:        [],
    updatedAt:          Date.now(),
  };
}

/** Hydrate a raw stored object into a full TasteProfile (adds missing fields). */
export function hydrateTasteProfile(raw: Partial<TasteProfile>): TasteProfile {
  return hydrate(raw);
}

function hydrate(raw: Partial<TasteProfile>): TasteProfile {
  const b = blank();
  return {
    genreWeights:       raw.genreWeights       ?? b.genreWeights,
    langWeights:        raw.langWeights        ?? b.langWeights,
    toneWeights:        { ...b.toneWeights,    ...(raw.toneWeights    ?? {}) },
    eraWeights:         { ...b.eraWeights,     ...(raw.eraWeights     ?? {}) },
    keywordWeights:     raw.keywordWeights     ?? b.keywordWeights,
    popularityTierBias: raw.popularityTierBias ?? b.popularityTierBias,
    runtimeBias:        raw.runtimeBias        ?? b.runtimeBias,
    voteFloor:          raw.voteFloor          ?? b.voteFloor,
    swipeCount:         raw.swipeCount         ?? b.swipeCount,
    likeCount:          raw.likeCount          ?? b.likeCount,
    recentLiked:        raw.recentLiked        ?? b.recentLiked,
    updatedAt:          raw.updatedAt          ?? b.updatedAt,
  };
}

export function loadTasteProfile(): TasteProfile {
  if (typeof window === "undefined") return blank();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return hydrate(JSON.parse(raw) as Partial<TasteProfile>);
    // Migrate from old v1 key
    const oldRaw = localStorage.getItem("cindr_taste_v1");
    if (oldRaw) return hydrate(JSON.parse(oldRaw) as Partial<TasteProfile>);
  } catch {
    // ignore
  }
  return blank();
}

export function saveTasteProfile(p: TasteProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // quota — non-fatal
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Compute the tone vector for a given set of genre names (averaged). */
export function computeCardTone(genres: string[]): ToneWeights {
  const tone = blankTone();
  if (genres.length === 0) return tone;
  for (const genre of genres) {
    const mapping = GENRE_TONE_MAP[genre];
    if (!mapping) continue;
    for (const [k, v] of Object.entries(mapping)) {
      (tone as Record<string, number>)[k] += v as number;
    }
  }
  // Normalize by genre count so multi-genre films don't score higher
  for (const k of Object.keys(tone) as (keyof ToneWeights)[]) {
    tone[k] /= genres.length;
  }
  return tone;
}

function yearToEraKey(year?: string): keyof EraWeights | null {
  if (!year) return null;
  const y = parseInt(year, 10);
  if (isNaN(y)) return null;
  if (y < 1980) return "pre1980";
  if (y < 1990) return "eighties";
  if (y < 2000) return "nineties";
  if (y < 2010) return "aughts";
  if (y < 2020) return "tens";
  return "recent";
}

export function updateTasteProfile(
  profile: TasteProfile,
  movie: {
    genres:          string[];
    language:        string;
    rating:          number;
    id:              number;
    mediaType:       "movie" | "tv";
    title:           string;
    year?:           string;
    tmdbPopularity?: number;
    voteCount?:      number;
    runtime?:        number;
  },
  liked: boolean
): TasteProfile {
  const p: TasteProfile = {
    ...profile,
    genreWeights:  { ...profile.genreWeights },
    langWeights:   { ...profile.langWeights },
    toneWeights:   { ...profile.toneWeights },
    eraWeights:    { ...profile.eraWeights },
    recentLiked:   [...profile.recentLiked],
  };

  // ── Decay all existing weights (the "never stale" core) ──────────────────
  for (const k of Object.keys(p.genreWeights)) p.genreWeights[k] *= DECAY;
  for (const k of Object.keys(p.langWeights)) {
    p.langWeights[k] = p.langWeights[k] * DECAY + (1 - DECAY) * 0.5;
  }
  for (const k of Object.keys(p.toneWeights) as (keyof ToneWeights)[]) {
    p.toneWeights[k] *= DECAY;
  }
  for (const k of Object.keys(p.eraWeights) as (keyof EraWeights)[]) {
    p.eraWeights[k] *= DECAY;
  }

  // ── Genre weights ─────────────────────────────────────────────────────────
  for (const genre of movie.genres) {
    const cur = p.genreWeights[genre] ?? 0;
    p.genreWeights[genre] = liked
      ? clamp(cur + LIKE_DELTA * (1 - cur), -1, 1)
      : clamp(cur - SKIP_DELTA * (1 + cur) * 0.6, -1, 1);
  }

  // ── Tone/vibe weights ─────────────────────────────────────────────────────
  const cardTone = computeCardTone(movie.genres);
  for (const k of Object.keys(cardTone) as (keyof ToneWeights)[]) {
    const val = cardTone[k];
    if (val < 0.05) continue; // too small to matter
    const cur = p.toneWeights[k];
    p.toneWeights[k] = liked
      ? clamp(cur + LIKE_DELTA * 0.75 * (1 - cur) * val, -1, 1)
      : clamp(cur - SKIP_DELTA * 0.75 * (1 + cur) * val * 0.6, -1, 1);
  }

  // ── Language affinity ─────────────────────────────────────────────────────
  if (movie.language) {
    const cur = p.langWeights[movie.language] ?? 0.5;
    p.langWeights[movie.language] = clamp(liked ? cur + 0.07 : cur - 0.04, 0, 1);
  }

  // ── Era weights ───────────────────────────────────────────────────────────
  const eraKey = yearToEraKey(movie.year);
  if (eraKey) {
    const cur = p.eraWeights[eraKey];
    p.eraWeights[eraKey] = liked
      ? clamp(cur + 0.18 * (1 - cur), -1, 1)
      : clamp(cur - 0.09 * (1 + cur) * 0.6, -1, 1);
  }

  // ── Popularity tier bias — learns gem vs mainstream preference ────────────
  if (movie.tmdbPopularity !== undefined && liked) {
    const isGem = movie.tmdbPopularity < 80;
    const delta = isGem ? 0.08 : -0.04;
    p.popularityTierBias = clamp(p.popularityTierBias * 0.97 + delta, -1, 1);
  }

  // ── Runtime bias ──────────────────────────────────────────────────────────
  if (movie.runtime && liked) {
    const target = movie.runtime < 90 ? -0.5 : movie.runtime > 130 ? 0.5 : 0;
    p.runtimeBias = clamp(p.runtimeBias * 0.95 + target * 0.08, -1, 1);
  }

  // ── Vote floor: slow EMA toward 90% of liked rating ──────────────────────
  if (liked && movie.rating > 0) {
    const target = movie.rating * 0.88;
    p.voteFloor = clamp(p.voteFloor * 0.93 + target * 0.07, 4.0, 7.5);
  }

  // ── Bookkeeping ───────────────────────────────────────────────────────────
  p.swipeCount += 1;
  if (liked) {
    p.likeCount += 1;
    p.recentLiked = [
      { id: movie.id, mediaType: movie.mediaType, title: movie.title, genres: movie.genres },
      ...p.recentLiked.filter((r) => r.id !== movie.id),
    ].slice(0, MAX_RECENT);
  }
  p.updatedAt = Date.now();
  return p;
}

/**
 * Enrich the profile with TMDB keywords from a liked movie.
 * Called async/background after a like — never blocks the swipe.
 */
export function updateProfileKeywords(
  profile: TasteProfile,
  keywords: string[]
): TasteProfile {
  if (keywords.length === 0) return profile;

  const p = { ...profile, keywordWeights: { ...profile.keywordWeights } };

  // Gentle decay on existing weights
  for (const k of Object.keys(p.keywordWeights)) {
    p.keywordWeights[k] *= 0.93;
  }

  // Reinforce each new keyword
  for (const kw of keywords.slice(0, 15)) {
    const cur = p.keywordWeights[kw] ?? 0;
    p.keywordWeights[kw] = clamp(cur + 0.22 * (1 - cur), 0, 1);
  }

  // Prune dead weight
  for (const k of Object.keys(p.keywordWeights)) {
    if (p.keywordWeights[k] < 0.05) delete p.keywordWeights[k];
  }

  return p;
}

export function hasSignal(p: TasteProfile): boolean {
  return p.swipeCount >= MIN_SIGNAL;
}

export function topGenreIds(p: TasteProfile, n = 3): number[] {
  return Object.entries(p.genreWeights)
    .filter(([, w]) => w > 0.08)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name]) => GENRE_NAME_TO_ID[name])
    .filter(Boolean) as number[];
}

export function dislikedGenreIds(p: TasteProfile, threshold = -0.25): number[] {
  return Object.entries(p.genreWeights)
    .filter(([, w]) => w < threshold)
    .map(([name]) => GENRE_NAME_TO_ID[name])
    .filter(Boolean) as number[];
}

export function explorationGenreId(p: TasteProfile, fetchCount: number): number | null {
  if (!hasSignal(p) || fetchCount % 7 !== 0) return null;
  const moderate = Object.entries(p.genreWeights)
    .filter(([, w]) => w > 0.05 && w < 0.45)
    .sort(() => Math.random() - 0.5);
  const name = moderate[0]?.[0];
  return name ? (GENRE_NAME_TO_ID[name] ?? null) : null;
}
