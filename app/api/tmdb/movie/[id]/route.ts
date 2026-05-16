import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);
    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const data = await getMovieDetails(movieId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB movie detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
