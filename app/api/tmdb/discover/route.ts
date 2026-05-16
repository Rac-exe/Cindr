import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, discoverTV } from "@/lib/tmdb/client";
import { buildDiscoverQuery, buildRelaxedQuery } from "@/lib/recommendations/buildDiscoverQuery";
import type { Movie } from "@/types/movie";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const languages = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const moods = searchParams.get("moods")?.split(",").filter(Boolean) ?? [];
    const contentTypes = searchParams.get("contentTypes")?.split(",").filter(Boolean) ?? [];
    const era = searchParams.get("era") ?? "any";
    const length = searchParams.get("length") ?? "any";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const includeAdult = searchParams.get("includeAdult") === "true";

    const wantsMovies = contentTypes.length === 0 || contentTypes.includes("movies");
    const wantsSeries = contentTypes.includes("series");
    const wantsAnime = contentTypes.includes("anime");
    const wantsDocs = contentTypes.includes("documentaries");

    const allResults: Movie[] = [];
    const baseParams = { languages, moods, era, length, page, includeAdult };

    const fetches: Promise<void>[] = [];

    if (wantsMovies) {
      fetches.push(
        discoverMovies(buildDiscoverQuery({ ...baseParams, isAnime: false }))
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
        discoverTV(buildDiscoverQuery({ ...baseParams, isAnime: false }))
          .then((data) => {
            allResults.push(...data.results);
          })
      );
    }

    if (wantsAnime) {
      fetches.push(
        discoverTV(buildDiscoverQuery({ ...baseParams, isAnime: true }))
          .then((data) => {
            allResults.push(...data.results);
          })
      );
      fetches.push(
        discoverMovies(buildDiscoverQuery({ ...baseParams, isAnime: true }))
          .then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
      );
    }

    if (wantsDocs) {
      const docParams = new URLSearchParams();
      docParams.set("sort_by", "popularity.desc");
      docParams.set("include_adult", includeAdult ? "true" : "false");
      docParams.set("with_genres", "99");
      docParams.set("page", String(page));
      docParams.set("vote_count.gte", "20");
      if (languages.length > 0) {
        docParams.set("with_original_language", languages.join("|"));
      }

      fetches.push(
        discoverMovies(docParams)
          .then((data) => {
            data.results.forEach((m) => {
              m.media_type = "movie";
              allResults.push(m);
            });
          })
      );
      fetches.push(
        discoverTV(docParams)
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
          discoverMovies(buildRelaxedQuery({ ...baseParams, isAnime: false }))
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
          discoverTV(buildRelaxedQuery({ ...baseParams, isAnime: false }))
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
