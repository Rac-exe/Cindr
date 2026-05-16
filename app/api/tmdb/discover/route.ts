import { NextRequest, NextResponse } from "next/server";
import { discoverMovies } from "@/lib/tmdb/client";
import { buildDiscoverQuery } from "@/lib/recommendations/buildDiscoverQuery";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const languages = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const moods = searchParams.get("moods")?.split(",").filter(Boolean) ?? [];
    const era = searchParams.get("era") ?? "any";
    const length = searchParams.get("length") ?? "any";
    const page = parseInt(searchParams.get("page") ?? "1", 10);

    const query = buildDiscoverQuery({ languages, moods, era, length, page });
    const data = await discoverMovies(query);

    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB discover error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
