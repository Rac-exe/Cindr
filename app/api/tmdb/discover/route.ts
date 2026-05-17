import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, discoverTV } from "@/lib/tmdb/client";
import { buildDiscoverQuery, buildRelaxedQuery } from "@/lib/recommendations/buildDiscoverQuery";
import type { Movie } from "@/types/movie";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const languages = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const moods = searchParams.get("moods")?.split(",").filter(Boolean) ?? [];
    const genres = searchParams
      .get("genres")
      ?.split(",")
      .map(Number)
      .filter((id) => Number.isFinite(id)) ?? [];
    const actorIds = searchParams
      .get("actors")
      ?.split("|")
      .map(Number)
      .filter((id) => Number.isFinite(id)) ?? [];
    const directorIds = searchParams
      .get("directors")
      ?.split("|")
      .map(Number)
      .filter((id) => Number.isFinite(id)) ?? [];
    const contentTypes = searchParams.get("contentTypes")?.split(",").filter(Boolean) ?? [];
    const era = searchParams.get("era") ?? "any";
    const length = searchParams.get("length") ?? "any";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const includeAdult = searchParams.get("includeAdult") === "true";
    const yearFrom = searchParams.get("yearFrom")
      ? Number(searchParams.get("yearFrom"))
      : null;
    const yearTo = searchParams.get("yearTo")
      ? Number(searchParams.get("yearTo"))
      : null;

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
      includeAdult,
      yearFrom: Number.isFinite(yearFrom) ? yearFrom : null,
      yearTo: Number.isFinite(yearTo) ? yearTo : null,
      actorIds,
      directorIds,
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
      const docMovieParams = new URLSearchParams();
      docMovieParams.set("sort_by", "popularity.desc");
      docMovieParams.set("include_adult", includeAdult ? "true" : "false");
      docMovieParams.set("with_genres", "99");
      docMovieParams.set("page", String(page));
      docMovieParams.set("vote_count.gte", "20");
      if (baseParams.yearFrom) {
        docMovieParams.set("primary_release_date.gte", `${baseParams.yearFrom}-01-01`);
      }
      if (baseParams.yearTo) {
        docMovieParams.set("primary_release_date.lte", `${baseParams.yearTo}-12-31`);
      }
      if (actorIds.length > 0) docMovieParams.set("with_cast", actorIds.join("|"));
      if (directorIds.length > 0) docMovieParams.set("with_crew", directorIds.join("|"));
      if (languages.length > 0) {
        docMovieParams.set("with_original_language", languages.join("|"));
      }

      const docTVParams = new URLSearchParams(docMovieParams);
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

      fetches.push(
        discoverMovies(docMovieParams)
          .then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
      );
      fetches.push(
        discoverTV(docTVParams)
          .then((data) => {
            allResults.push(...data.results);
          })
      );
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
              includePeople: false,
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
              includePeople: false,
            })
          )
            .then((data) => {
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

    deduped.sort((a, b) => b.popularity - a.popularity);

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
