import {
  ANIME_MOVIE_MOOD_TO_GENRES,
  ANIME_TV_MOOD_TO_GENRES,
  MOVIE_MOOD_TO_GENRES,
  TV_MOOD_TO_GENRES,
} from "@/lib/constants/quiz";

export interface DiscoverParams {
  languages: string[];
  moods: string[];
  genres: number[];
  era: string;
  length: string;
  page?: number;
  isAnime?: boolean;
  mediaType?: "movie" | "tv";
  yearFrom?: number | null;
  yearTo?: number | null;
  actorIds?: number[];
  directorIds?: number[];
  includePeople?: boolean;
  /** Genre IDs learned from swipe history (appended with OR logic) */
  learnedGenreIds?: number[];
  /** Genre IDs to exclude based on negative swipe history */
  excludeGenreIds?: number[];
  /** Minimum vote_average from taste profile */
  voteFloor?: number;
}

function dateParamPrefix(params: DiscoverParams): string {
  return params.mediaType === "tv" ? "first_air_date" : "primary_release_date";
}

function setYearRange(q: URLSearchParams, params: DiscoverParams): void {
  const prefix = dateParamPrefix(params);
  if (params.yearFrom) q.set(`${prefix}.gte`, `${params.yearFrom}-01-01`);
  if (params.yearTo) q.set(`${prefix}.lte`, `${params.yearTo}-12-31`);
}

function setPeopleFilters(q: URLSearchParams, params: DiscoverParams): void {
  if (params.includePeople === false) return;

  const actorIds = params.actorIds ?? [];
  const directorIds = params.directorIds ?? [];
  if (params.mediaType === "tv") {
    const peopleIds = [...actorIds, ...directorIds];
    if (peopleIds.length > 0) q.set("with_people", peopleIds.join("|"));
    return;
  }

  if (actorIds.length > 0) q.set("with_cast", actorIds.join("|"));
  if (directorIds.length > 0) q.set("with_crew", directorIds.join("|"));
}

function moodGenreMap(params: DiscoverParams): Record<string, number[]> {
  if (params.isAnime) {
    return params.mediaType === "tv"
      ? ANIME_TV_MOOD_TO_GENRES
      : ANIME_MOVIE_MOOD_TO_GENRES;
  }
  return params.mediaType === "tv" ? TV_MOOD_TO_GENRES : MOVIE_MOOD_TO_GENRES;
}

function collectMoodGenres(params: DiscoverParams): number[] {
  const map = moodGenreMap(params);
  const genreIds = new Set<number>();
  for (const mood of params.moods) {
    const ids = map[mood];
    if (ids) ids.forEach((id) => genreIds.add(id));
  }
  return Array.from(genreIds);
}

function explicitGenresForMedia(params: DiscoverParams): number[] {
  if (params.mediaType !== "tv") return params.genres;

  const tvGenreMap: Record<number, number[]> = {
    12: [10759],
    14: [10765],
    27: [9648],
    28: [10759],
    53: [9648],
    878: [10765],
    10749: [18],
  };

  return params.genres.flatMap((id) => tvGenreMap[id] ?? [id]);
}

function setGenreFilters(q: URLSearchParams, params: DiscoverParams): void {
  const moodGenreIds = collectMoodGenres(params);
  const genreIds = new Set<number>(explicitGenresForMedia(params));
  moodGenreIds.forEach((id) => genreIds.add(id));

  // Blend in learned genres when no explicit user genres are set
  if ((params.learnedGenreIds?.length ?? 0) > 0 && genreIds.size === 0 && moodGenreIds.length === 0) {
    params.learnedGenreIds!.forEach((id) => genreIds.add(id));
  }

  if (params.isAnime) {
    const animeSubGenres = Array.from(genreIds).filter((id) => id !== 16);
    q.set(
      "with_genres",
      animeSubGenres.length > 0 ? `16,${animeSubGenres.join("|")}` : "16"
    );
    return;
  }

  if (genreIds.size > 0) {
    q.set("with_genres", Array.from(genreIds).join("|"));
  }

  // Exclude strongly disliked genres
  if ((params.excludeGenreIds?.length ?? 0) > 0) {
    q.set("without_genres", params.excludeGenreIds!.join(","));
  }
}

export function buildDiscoverQuery(params: DiscoverParams): URLSearchParams {
  const q = new URLSearchParams();

  q.set("sort_by", "popularity.desc");
  q.set("include_adult", "false");
  q.set("include_video", "false");
  q.set("page", String(params.page ?? 1));

  if (params.isAnime) {
    q.set("with_original_language", "ja");
    setGenreFilters(q, params);
  } else {
    if (params.languages.length > 0) {
      q.set("with_original_language", params.languages.join("|"));
    }
    setGenreFilters(q, params);
  }

  const now = new Date();
  const year = now.getFullYear();
  if (params.yearFrom || params.yearTo) {
    setYearRange(q, params);
  } else if (params.mediaType !== "tv") {
    const eraValues = (params.era ?? "any").split(",").filter(Boolean);
    if (eraValues.length > 0 && !eraValues.includes("any")) {
      const hasNew = eraValues.includes("new");
      const hasModern = eraValues.includes("modern");
      const hasClassic = eraValues.includes("classic");
      const prefix = dateParamPrefix(params);
      // lower bound: only if classic not selected (classic goes back to beginning)
      if (!hasClassic) {
        if (hasNew && !hasModern) q.set(`${prefix}.gte`, `${year - 2}-01-01`);
        else if (hasModern) q.set(`${prefix}.gte`, "2000-01-01");
      }
      // upper bound: only if new not selected (new has no ceiling)
      if (!hasNew) {
        if (hasClassic && !hasModern) q.set(`${prefix}.lte`, "1999-12-31");
        else if (hasModern) q.set(`${prefix}.lte`, "2019-12-31");
      }
    }
  }

  if (params.mediaType === "tv") {
    switch (params.length) {
      case "short":
        q.set("with_runtime.lte", "100");
        break;
      case "medium":
        q.set("with_runtime.gte", "100");
        q.set("with_runtime.lte", "150");
        break;
      case "long":
        q.set("with_runtime.gte", "150");
        break;
    }
  }

  q.set("vote_count.gte", "20");
  if (params.voteFloor && params.voteFloor > 4.0) {
    q.set("vote_average.gte", params.voteFloor.toFixed(1));
  }
  setPeopleFilters(q, params);

  return q;
}

export function buildRelaxedQuery(params: DiscoverParams): URLSearchParams {
  const q = new URLSearchParams();
  q.set("sort_by", "popularity.desc");
  q.set("include_adult", "false");
  q.set("include_video", "false");
  q.set("page", String(params.page ?? 1));

  if (params.isAnime) {
    q.set("with_original_language", "ja");
    setGenreFilters(q, params);
  } else {
    if (params.languages.length > 0) {
      q.set("with_original_language", params.languages.join("|"));
    }
    setGenreFilters(q, { ...params, moods: [] });
  }

  setYearRange(q, params);

  q.set("vote_count.gte", "5");
  setPeopleFilters(q, params);

  return q;
}
