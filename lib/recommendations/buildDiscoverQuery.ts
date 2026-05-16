import { MOOD_TO_GENRES } from "@/lib/constants/quiz";

export interface DiscoverParams {
  languages: string[];
  moods: string[];
  era: string;
  length: string;
  page?: number;
  isAnime?: boolean;
  includeAdult?: boolean;
}

export function buildDiscoverQuery(params: DiscoverParams): URLSearchParams {
  const q = new URLSearchParams();

  q.set("sort_by", "popularity.desc");
  q.set("include_adult", params.includeAdult ? "true" : "false");
  q.set("include_video", "false");
  q.set("page", String(params.page ?? 1));

  if (params.isAnime) {
    q.set("with_original_language", "ja");
    q.set("with_genres", "16");
  } else {
    if (params.languages.length > 0) {
      q.set("with_original_language", params.languages.join("|"));
    }

    const genreIds = new Set<number>();
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
  switch (params.era) {
    case "new":
      q.set("primary_release_date.gte", `${year - 2}-01-01`);
      break;
    case "modern":
      q.set("primary_release_date.gte", "2000-01-01");
      q.set("primary_release_date.lte", "2019-12-31");
      break;
    case "classic":
      q.set("primary_release_date.lte", "1999-12-31");
      break;
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

  return q;
}

export function buildRelaxedQuery(params: DiscoverParams): URLSearchParams {
  const q = new URLSearchParams();
  q.set("sort_by", "popularity.desc");
  q.set("include_adult", params.includeAdult ? "true" : "false");
  q.set("include_video", "false");
  q.set("page", String(params.page ?? 1));

  if (params.isAnime) {
    q.set("with_original_language", "ja");
    q.set("with_genres", "16");
  } else if (params.languages.length > 0) {
    q.set("with_original_language", params.languages.join("|"));
  }

  q.set("vote_count.gte", "5");

  return q;
}
