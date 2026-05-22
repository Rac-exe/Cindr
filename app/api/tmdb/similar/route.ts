import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";

  if (!id || !TMDB_KEY) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Fetch both /recommendations and /similar in parallel, merge
    const [recRes, simRes] = await Promise.all([
      fetch(`${TMDB_BASE}/${type}/${id}/recommendations?api_key=${TMDB_KEY}&page=1`),
      fetch(`${TMDB_BASE}/${type}/${id}/similar?api_key=${TMDB_KEY}&page=1`),
    ]);

    const [recData, simData] = await Promise.all([
      recRes.ok ? recRes.json() : { results: [] },
      simRes.ok ? simRes.json() : { results: [] },
    ]);

    const seen = new Set<number>();
    const merged = [...(recData.results ?? []), ...(simData.results ?? [])]
      .filter((m) => {
        if (!m.poster_path || seen.has(m.id)) return false;
        seen.add(m.id);
        return (m.vote_average ?? 0) >= 5.0 && (m.vote_count ?? 0) >= 20;
      })
      .map((m) => ({ ...m, media_type: type }))
      .slice(0, 12);

    return NextResponse.json({ results: merged });
  } catch (err) {
    console.error("TMDB similar error:", err);
    return NextResponse.json({ results: [] });
  }
}
