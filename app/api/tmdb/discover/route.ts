import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, discoverTV } from "@/lib/tmdb/client";
import { buildDiscoverQuery, buildRelaxedQuery } from "@/lib/recommendations/buildDiscoverQuery";
import {
  DOCUMENTARY_MOVIE_TOPIC_GENRES,
  DOCUMENTARY_TV_TOPIC_GENRES,
} from "@/lib/constants/quiz";
import type { Movie } from "@/types/movie";

const LOCAL_DISCOVER_RESULTS: Movie[] = [
  {
    id: 27205,
    title: "Inception",
    original_title: "Inception",
    overview:
      "A skilled thief enters dreams to plant an idea inside a target's mind.",
    poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop_path: null,
    release_date: "2010-07-16",
    vote_average: 8.8,
    vote_count: 36000,
    popularity: 95,
    genre_ids: [28, 878, 53],
    original_language: "en",
    adult: false,
    media_type: "movie",
  },
  {
    id: 155,
    title: "The Dark Knight",
    original_title: "The Dark Knight",
    overview:
      "Batman faces a criminal mastermind who throws Gotham into chaos.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: null,
    release_date: "2008-07-18",
    vote_average: 9,
    vote_count: 33000,
    popularity: 90,
    genre_ids: [28, 80, 18],
    original_language: "en",
    adult: false,
    media_type: "movie",
  },
  {
    id: 157336,
    title: "Interstellar",
    original_title: "Interstellar",
    overview:
      "Explorers travel through a wormhole in search of a future for humanity.",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: null,
    release_date: "2014-11-07",
    vote_average: 8.7,
    vote_count: 35000,
    popularity: 92,
    genre_ids: [12, 18, 878],
    original_language: "en",
    adult: false,
    media_type: "movie",
  },
  {
    id: 438631,
    title: "Dune",
    original_title: "Dune",
    overview:
      "A gifted young man travels to a dangerous desert planet with a vast destiny.",
    poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    backdrop_path: null,
    release_date: "2021-10-22",
    vote_average: 8,
    vote_count: 13000,
    popularity: 88,
    genre_ids: [12, 878],
    original_language: "en",
    adult: false,
    media_type: "movie",
  },
];

function parsePositiveIds(value: string | null, separator: string): number[] {
  return (
    value
      ?.split(separator)
      .map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0) ?? []
  );
}

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(1870, Math.min(2100, Math.round(parsed)));
}

function documentaryTopicGenreIds(
  moods: string[],
  map: Record<string, number[]>
): number[] {
  const ids = new Set<number>();
  for (const mood of moods) {
    map[mood]?.forEach((id) => ids.add(id));
  }
  return Array.from(ids);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const languages = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const moods = searchParams.get("moods")?.split(",").filter(Boolean) ?? [];
    const genres = parsePositiveIds(searchParams.get("genres"), ",");
    const actorIds = parsePositiveIds(searchParams.get("actors"), "|");
    const directorIds = parsePositiveIds(searchParams.get("directors"), "|");
    const learnedGenreIds = parsePositiveIds(searchParams.get("learnedGenres"), ",");
    const excludeGenreIds = parsePositiveIds(searchParams.get("excludeGenres"), ",");
    const voteFloor = parseFloat(searchParams.get("voteFloor") ?? "0") || undefined;
    const contentTypes = searchParams.get("contentTypes")?.split(",").filter(Boolean) ?? [];
    const mode = searchParams.get("mode") === "random" ? "random" : "taste";
    const era = searchParams.get("era") ?? "any";
    const length = searchParams.get("length") ?? "any";
    const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isSafeInteger(parsedPage)
      ? Math.max(1, Math.min(500, parsedPage))
      : 1;
    const rawYearFrom = parseYear(searchParams.get("yearFrom"));
    const rawYearTo = parseYear(searchParams.get("yearTo"));
    const yearFrom =
      rawYearFrom && rawYearTo && rawYearFrom > rawYearTo
        ? rawYearTo
        : rawYearFrom;
    const yearTo =
      rawYearFrom && rawYearTo && rawYearFrom > rawYearTo
        ? rawYearFrom
        : rawYearTo;

    if (!process.env.TMDB_API_KEY && !process.env.TMDB_READ_ACCESS_TOKEN) {
      const rotated = LOCAL_DISCOVER_RESULTS.map((_, index, items) => {
        const offset = (page - 1) % items.length;
        return items[(index + offset) % items.length];
      });
      return NextResponse.json({
        page,
        results: rotated,
        total_results: rotated.length,
        total_pages: 1,
      });
    }

    const wantsMovies = contentTypes.length === 0 || contentTypes.includes("movies");
    const wantsSeries = contentTypes.includes("series");
    const wantsAnime = contentTypes.includes("anime");
    const wantsDocs = contentTypes.includes("documentaries");

    const allResults: Movie[] = [];
    const baseParams = {
      languages,
      moods,
      genres,
      era,
      length,
      page,
      yearFrom,
      yearTo,
      actorIds,
      directorIds,
      learnedGenreIds: learnedGenreIds.length > 0 ? learnedGenreIds : undefined,
      excludeGenreIds: excludeGenreIds.length > 0 ? excludeGenreIds : undefined,
      voteFloor,
    };

    const fetches: Promise<void>[] = [];

    if (wantsMovies) {
      fetches.push(
        discoverMovies(
          buildDiscoverQuery({
            ...baseParams,
            isAnime: false,
            mediaType: "movie",
          })
        )
          .then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
      );
    }

    if (wantsSeries) {
      fetches.push(
        discoverTV(
          buildDiscoverQuery({
            ...baseParams,
            isAnime: false,
            mediaType: "tv",
          })
        )
          .then((data) => {
            allResults.push(...data.results);
          })
      );
    }

    if (wantsAnime) {
      fetches.push(
        discoverTV(
          buildDiscoverQuery({
            ...baseParams,
            isAnime: true,
            mediaType: "tv",
          })
        )
          .then((data) => {
            allResults.push(...data.results);
          })
      );
      fetches.push(
        discoverMovies(
          buildDiscoverQuery({
            ...baseParams,
            isAnime: true,
            mediaType: "movie",
          })
        )
          .then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
      );
    }

    if (wantsDocs) {
      const movieTopicIds = documentaryTopicGenreIds(
        moods,
        DOCUMENTARY_MOVIE_TOPIC_GENRES
      );
      const tvTopicIds = documentaryTopicGenreIds(moods, DOCUMENTARY_TV_TOPIC_GENRES);
      const movieGenreFilters =
        movieTopicIds.length > 0
          ? movieTopicIds.map((id) => `99,${id}`)
          : ["99"];
      const tvGenreFilters =
        tvTopicIds.length > 0 ? tvTopicIds.map((id) => `99,${id}`) : ["99"];

      const createDocMovieParams = (genreFilter: string) => {
        const docMovieParams = new URLSearchParams();
        docMovieParams.set(
          "sort_by",
          mode === "random" ? "vote_count.desc" : "popularity.desc"
        );
        docMovieParams.set("include_adult", "false");
        docMovieParams.set("with_genres", genreFilter);
        docMovieParams.set("page", String(page));
        docMovieParams.set("vote_count.gte", "20");
        if (baseParams.yearFrom) {
          docMovieParams.set(
            "primary_release_date.gte",
            `${baseParams.yearFrom}-01-01`
          );
        }
        if (baseParams.yearTo) {
          docMovieParams.set(
            "primary_release_date.lte",
            `${baseParams.yearTo}-12-31`
          );
        }
        if (actorIds.length > 0) docMovieParams.set("with_cast", actorIds.join("|"));
        if (directorIds.length > 0) {
          docMovieParams.set("with_crew", directorIds.join("|"));
        }
        if (mode === "taste" && languages.length > 0) {
          docMovieParams.set("with_original_language", languages.join("|"));
        }
        return docMovieParams;
      };

      const createDocTVParams = (genreFilter: string) => {
        const docTVParams = createDocMovieParams(genreFilter);
        docTVParams.delete("primary_release_date.gte");
        docTVParams.delete("primary_release_date.lte");
        docTVParams.delete("with_cast");
        docTVParams.delete("with_crew");
        if (baseParams.yearFrom) {
          docTVParams.set("first_air_date.gte", `${baseParams.yearFrom}-01-01`);
        }
        if (baseParams.yearTo) {
          docTVParams.set("first_air_date.lte", `${baseParams.yearTo}-12-31`);
        }
        const peopleIds = [...actorIds, ...directorIds];
        if (peopleIds.length > 0) docTVParams.set("with_people", peopleIds.join("|"));
        return docTVParams;
      };

      for (const genreFilter of movieGenreFilters) {
        fetches.push(
          discoverMovies(createDocMovieParams(genreFilter)).then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
        );
      }
      for (const genreFilter of tvGenreFilters) {
        fetches.push(
          discoverTV(createDocTVParams(genreFilter)).then((data) => {
            allResults.push(...data.results);
          })
        );
      }
    }

    await Promise.all(fetches);

    if (allResults.length < 5) {
      const relaxedFetches: Promise<void>[] = [];

      if (wantsMovies || contentTypes.length === 0) {
        relaxedFetches.push(
          discoverMovies(
            buildRelaxedQuery({
              ...baseParams,
              isAnime: false,
              mediaType: "movie",
            })
          )
            .then((data) => {
              data.results.forEach((m) => {
                m.media_type = "movie";
                allResults.push(m);
              });
            })
        );
      }
      if (wantsSeries) {
        relaxedFetches.push(
          discoverTV(
            buildRelaxedQuery({
              ...baseParams,
              isAnime: false,
              mediaType: "tv",
            })
          )
            .then((data) => {
              allResults.push(...data.results);
            })
        );
      }
      if (wantsAnime) {
        relaxedFetches.push(
          discoverTV(
            buildRelaxedQuery({
              ...baseParams,
              moods: [],
              isAnime: true,
              mediaType: "tv",
            })
          ).then((data) => {
            allResults.push(...data.results);
          })
        );
        relaxedFetches.push(
          discoverMovies(
            buildRelaxedQuery({
              ...baseParams,
              moods: [],
              isAnime: true,
              mediaType: "movie",
            })
          ).then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
        );
      }
      if (wantsDocs) {
        const docMovieParams = new URLSearchParams();
        docMovieParams.set("sort_by", "popularity.desc");
        docMovieParams.set("include_adult", "false");
        docMovieParams.set("with_genres", "99");
        docMovieParams.set("page", String(page));
        docMovieParams.set("vote_count.gte", "5");
        if (baseParams.yearFrom) {
          docMovieParams.set(
            "primary_release_date.gte",
            `${baseParams.yearFrom}-01-01`
          );
        }
        if (baseParams.yearTo) {
          docMovieParams.set(
            "primary_release_date.lte",
            `${baseParams.yearTo}-12-31`
          );
        }

        const docTVParams = new URLSearchParams(docMovieParams);
        docTVParams.delete("primary_release_date.gte");
        docTVParams.delete("primary_release_date.lte");
        if (baseParams.yearFrom) {
          docTVParams.set("first_air_date.gte", `${baseParams.yearFrom}-01-01`);
        }
        if (baseParams.yearTo) {
          docTVParams.set("first_air_date.lte", `${baseParams.yearTo}-12-31`);
        }

        relaxedFetches.push(
          discoverMovies(docMovieParams).then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
        );
        relaxedFetches.push(
          discoverTV(docTVParams).then((data) => {
            allResults.push(...data.results);
          })
        );
      }

      await Promise.all(relaxedFetches);
    }

    const seen = new Set<number>();
    const deduped = allResults.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    deduped.sort((a, b) =>
      mode === "random"
        ? Math.random() - 0.5
        : b.popularity - a.popularity
    );

    return NextResponse.json({
      page,
      results: deduped,
      total_results: deduped.length,
      total_pages: 1,
    });
  } catch (error) {
    console.error("TMDB discover error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
