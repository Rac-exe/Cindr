import { MOOD_TO_GENRES } from "@/lib/constants/quiz";

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

export function buildDiscoverQuery(params: DiscoverParams): URLSearchParams {
  const q = new URLSearchParams();

  q.set("sort_by", "popularity.desc");
  q.set("include_adult", "false");
  q.set("include_video", "false");
  q.set("page", String(params.page ?? 1));

  if (params.isAnime) {
    q.set("with_original_language", "ja");
    q.set("with_genres", "16");
  } else {
    if (params.languages.length > 0) {
      q.set("with_original_language", params.languages.join("|"));
    }

    const genreIds = new Set<number>(params.genres);
    for (const mood of params.moods) {
      const ids = MOOD_TO_GENRES[mood];
      if (ids) ids.forEach((id) => genreIds.add(id));
    }
    if (genreIds.size > 0) {
      q.set("with_genres", Array.from(genreIds).join("|"));
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  if (params.yearFrom || params.yearTo) {
    setYearRange(q, params);
  } else {
    const prefix = dateParamPrefix(params);
    switch (params.era) {
      case "new":
        q.set(`${prefix}.gte`, `${year - 2}-01-01`);
        break;
      case "modern":
        q.set(`${prefix}.gte`, "2000-01-01");
        q.set(`${prefix}.lte`, "2019-12-31");
        break;
      case "classic":
        q.set(`${prefix}.lte`, "1999-12-31");
        break;
    }
  }

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

  q.set("vote_count.gte", "20");
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
    q.set("with_genres", "16");
  } else {
    if (params.languages.length > 0) {
      q.set("with_original_language", params.languages.join("|"));
    }
    if (params.genres.length > 0) {
      q.set("with_genres", params.genres.join("|"));
    }
  }

  setYearRange(q, params);

  q.set("vote_count.gte", "5");
  setPeopleFilters(q, params);

  return q;
}
