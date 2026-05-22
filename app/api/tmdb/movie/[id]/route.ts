import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);
    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const mediaType = request.nextUrl.searchParams.get("type") ?? "movie";
    if (mediaType !== "movie" && mediaType !== "tv") {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const data =
      mediaType === "tv"
        ? await getTVDetails(movieId)
        : await getMovieDetails(movieId);
    if (data.adult) {
      return NextResponse.json({ error: "Title unavailable" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 }
    );
  }
}
