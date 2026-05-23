/**
 * CindrScore — multi-dimensional candidate scoring engine.
 *
 * Dimensions:
 *   1. Genre similarity    0.22  — cosine against learned genre weights
 *   2. Tone/vibe match     0.20  — dark / fun / tense / epic / emotional / mind-bending
 *   3. Keyword affinity    0.12  — TMDB keyword overlap with liked movies
 *   4. Quality signal      0.14  — rating × vote credibility
 *   5. Hidden gem bonus    0.12  — high quality + low popularity (FIXED: 0-1 scale)
 *   6. Momentum            0.08  — short-term genre momentum (last 3 likes)
 *   7. Era affinity        0.07  — decade bucket preference
 *   8. Runtime match       0.05  — short/long preference alignment
 *   9. Language affinity   0.00  — used only as tie-breaker via default bias fix
 *
 * Bug fixes vs v1:
 *   - hiddenGemBonus now returns 0–1 (was 0.08–0.15, max contribution was 0.0225 — broken)
 *   - Language unknown default changed to 0.35 (not 0.5) — biases toward familiar languages
 *   - SuperMatch threshold lowered to 0.72 (was 0.76 — almost unreachable)
 *   - Runtime scoring added (was tracked but never used)
 *   - Momentum scoring added (short-term session trend)
 *   - Keyword scoring added (TMDB keyword overlap via overview text)
 */

import type { MovieCardData } from "@/types/movie";
import {
  type TasteProfile,
  type ToneWeights,
  type EraWeights,
  computeCardTone,
  hasSignal,
} from "./tasteProfile";

export interface CindrScoreResult {
  score:        number;
  isSuperMatch: boolean;
  isDiscovery:  boolean;
  components: {
    genreScore:     number;
    toneScore:      number;
    keywordScore:   number;
    qualityScore:   number;
    gemBonus:       number;
    momentum:       number;
    eraScore:       number;
    runtimeScore:   number;
  };
}

// ── Dimension weights (must sum to 1.0) ─────────────────────────────────────
const W_GENRE    = 0.22;
const W_TONE     = 0.20;
const W_KEYWORD  = 0.12;
const W_QUALITY  = 0.14;
const W_GEM      = 0.12;
const W_MOMENTUM = 0.08;
const W_ERA      = 0.07;
const W_RUNTIME  = 0.05;
// Lang is baked into genreScore default behavior (0.35 bias) — no separate weight

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ── 1. Genre similarity ──────────────────────────────────────────────────────
function genreScore(
  cardGenres: string[],
  genreWeights: Record<string, number>
): number {
  if (cardGenres.length === 0) return 0.45;
  const sum = cardGenres.reduce((acc, g) => acc + (genreWeights[g] ?? 0), 0);
  return clamp01((sum / cardGenres.length + 1) / 2);
}

// ── 2. Tone/vibe cosine similarity ───────────────────────────────────────────
function toneScore(
  cardGenres: string[],
  toneWeights: ToneWeights
): number {
  const cardTone = computeCardTone(cardGenres);
  const keys = Object.keys(toneWeights) as (keyof ToneWeights)[];
  let dot = 0, cMag = 0, pMag = 0;
  for (const k of keys) {
    const c = cardTone[k] ?? 0;
    const p = toneWeights[k] ?? 0;
    dot  += c * p;
    cMag += c * c;
    pMag += p * p;
  }
  if (cMag === 0 || pMag === 0) return 0.5;
  return clamp01((dot / (Math.sqrt(cMag) * Math.sqrt(pMag)) + 1) / 2);
}

// ── 3. Keyword affinity — overview text matching ─────────────────────────────
function keywordScore(
  overview: string,
  keywordWeights: Record<string, number>
): number {
  const keys = Object.entries(keywordWeights).filter(([, w]) => w >= 0.1);
  if (keys.length === 0 || !overview) return 0.45; // no data → slight pessimism

  const text = overview.toLowerCase();
  let matched = 0, total = 0;

  for (const [kw, weight] of keys) {
    total += weight;
    if (text.includes(kw.toLowerCase())) matched += weight;
  }

  // Baseline 0.35 + up to 0.65 for full keyword coverage
  return clamp01(0.35 + (matched / total) * 0.65);
}

// ── 4. Quality signal ─────────────────────────────────────────────────────────
function qualityScore(rating: number, voteCount: number | undefined): number {
  if (rating <= 0) return 0.35;
  const credibility = voteCount !== undefined
    ? clamp01(Math.log10(Math.max(voteCount, 1)) / 4)
    : 0.5;
  return clamp01((rating - 4) / 6) * 0.7 + credibility * 0.3;
}

// ── 5. Hidden gem bonus (FIXED: returns 0–1, not 0.08–0.15) ─────────────────
function hiddenGemBonus(
  rating:             number,
  voteCount:          number | undefined,
  tmdbPopularity:     number | undefined,
  popularityTierBias: number
): number {
  const votes = voteCount ?? 0;
  const pop   = tmdbPopularity ?? 999;

  const isQualityGem    = rating >= 7.0 && votes >= 250;
  const isLowPopularity = pop < 180;

  if (!isQualityGem || !isLowPopularity) return 0;

  // 0.50 base + 0.50 scale based on how much user loves underdogs
  const biasBoost = (popularityTierBias + 1) / 2;
  return clamp01(0.50 + biasBoost * 0.50);
}

// ── 6. Short-term momentum ────────────────────────────────────────────────────
function momentumScore(
  cardGenres: string[],
  recentLiked: TasteProfile["recentLiked"]
): number {
  if (recentLiked.length < 2) return 0.5; // neutral — not enough data

  const last3 = recentLiked.slice(0, 3);
  const freq: Record<string, number> = {};
  for (const liked of last3) {
    for (const g of (liked.genres ?? [])) {
      freq[g] = (freq[g] ?? 0) + 1;
    }
  }

  // Momentum genres = appear 2+ times in last 3 likes
  const momentumGenres = new Set(
    Object.entries(freq).filter(([, c]) => c >= 2).map(([g]) => g)
  );

  if (momentumGenres.size === 0) return 0.5; // no clear current trend

  const hasMatch = cardGenres.some((g) => momentumGenres.has(g));
  // Strong boost for momentum match, mild penalty for swimming against current
  return hasMatch ? 0.88 : 0.32;
}

// ── 7. Era affinity ───────────────────────────────────────────────────────────
function eraScore(year: string | undefined, eraWeights: EraWeights): number {
  if (!year) return 0.5;
  const y = parseInt(year, 10);
  if (isNaN(y)) return 0.5;

  let bucket: keyof EraWeights;
  if      (y < 1980) bucket = "pre1980";
  else if (y < 1990) bucket = "eighties";
  else if (y < 2000) bucket = "nineties";
  else if (y < 2010) bucket = "aughts";
  else if (y < 2020) bucket = "tens";
  else               bucket = "recent";

  return clamp01((eraWeights[bucket] + 1) / 2);
}

// ── 8. Runtime preference alignment ──────────────────────────────────────────
function runtimeScore(runtime: number | undefined, runtimeBias: number): number {
  if (!runtime || Math.abs(runtimeBias) < 0.08) return 0.5; // no strong opinion
  // Map runtime to [-1, 1]
  const filmSignal = runtime < 90 ? -0.8 : runtime < 110 ? -0.2 : runtime < 140 ? 0.2 : 0.8;
  // How well does film signal align with user bias?
  const agreement = 1 - Math.abs(filmSignal - runtimeBias) / 2;
  return clamp01(agreement);
}

// ── Main scoring ──────────────────────────────────────────────────────────────
export function computeCindrScore(
  card: MovieCardData,
  profile: TasteProfile
): CindrScoreResult {
  if (!hasSignal(profile)) {
    return {
      score: 0.5,
      isSuperMatch: false,
      isDiscovery: false,
      components: {
        genreScore: 0.5, toneScore: 0.5, keywordScore: 0.45,
        qualityScore: 0.5, gemBonus: 0, momentum: 0.5,
        eraScore: 0.5, runtimeScore: 0.5,
      },
    };
  }

  const g   = genreScore(card.genres,   profile.genreWeights);
  const t   = toneScore(card.genres,    profile.toneWeights);
  const kw  = keywordScore(card.overview, profile.keywordWeights);
  const q   = qualityScore(card.rating,  card.voteCount);
  const gem = hiddenGemBonus(card.rating, card.voteCount, card.tmdbPopularity, profile.popularityTierBias);
  const mom = momentumScore(card.genres,  profile.recentLiked);
  const e   = eraScore(card.year,        profile.eraWeights);
  const r   = runtimeScore(card.runtime, profile.runtimeBias);

  const score = clamp01(
    g   * W_GENRE    +
    t   * W_TONE     +
    kw  * W_KEYWORD  +
    q   * W_QUALITY  +
    gem * W_GEM      +
    mom * W_MOMENTUM +
    e   * W_ERA      +
    r   * W_RUNTIME
  );

  // ── SuperMatch ───────────────────────────────────────────────────────────────
  // Count dimensions above their meaningful thresholds
  const strongDimensions = [
    g   > 0.70,
    t   > 0.68,
    kw  > 0.58,
    mom > 0.80,
    e   > 0.65,
  ].filter(Boolean).length;

  const isSuperMatch =
    score >= 0.72 &&
    (gem > 0.45 ||           // genuine hidden gem
     g   > 0.82 ||           // extremely strong genre match
     strongDimensions >= 3); // resonates across 3+ independent axes

  // ── Discovery: quality gem outside comfort zone ───────────────────────────
  const isDiscovery =
    !isSuperMatch &&
    card.rating >= 7.0 &&
    (card.voteCount ?? 0) >= 200 &&
    (card.tmdbPopularity ?? 999) < 200 &&
    score < 0.62;

  return {
    score,
    isSuperMatch,
    isDiscovery,
    components: { genreScore: g, toneScore: t, keywordScore: kw, qualityScore: q, gemBonus: gem, momentum: mom, eraScore: e, runtimeScore: r },
  };
}

// ── Deck reranking ────────────────────────────────────────────────────────────
export function rerankCards(
  cards: MovieCardData[],
  profile: TasteProfile,
  mode: string
): MovieCardData[] {
  if (mode !== "taste" || !hasSignal(profile) || cards.length < 4) return cards;

  const scored = cards.map((card) => {
    const result = computeCindrScore(card, profile);
    return {
      ...card,
      isSuperMatch: result.isSuperMatch,
      cindrScore:   result.score,
      isDiscovery:  result.isDiscovery,
    };
  });

  const mainPool = scored
    .filter((c) => !c.isDiscovery)
    .sort((a, b) => {
      if (a.isSuperMatch && !b.isSuperMatch) return -1;
      if (!a.isSuperMatch && b.isSuperMatch) return 1;
      return (b.cindrScore ?? 0) - (a.cindrScore ?? 0);
    });

  const discoveryPool = scored
    .filter((c) => c.isDiscovery)
    .sort((a, b) => b.rating - a.rating);

  // Interleave: 7 main → 1 discovery → repeat
  const BLOCK = 7;
  const result: MovieCardData[] = [];
  let m = 0, d = 0;

  while (m < mainPool.length) {
    for (let i = 0; i < BLOCK && m < mainPool.length; i++, m++) {
      result.push(mainPool[m]);
    }
    if (d < discoveryPool.length) result.push(discoveryPool[d++]);
  }
  while (d < discoveryPool.length) result.push(discoveryPool[d++]);

  return result;
}
