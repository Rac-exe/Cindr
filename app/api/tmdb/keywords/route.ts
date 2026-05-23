import { NextRequest, NextResponse } from "next/server";

const TMDB_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  const id   = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type") === "tv" ? "tv" : "movie";

  if (!id || !TMDB_KEY) return NextResponse.json({ keywords: [] });

  try {
    const url =
      type === "tv"
        ? `https://api.themoviedb.org/3/tv/${id}/keywords?api_key=${TMDB_KEY}`
        : `https://api.themoviedb.org/3/movie/${id}/keywords?api_key=${TMDB_KEY}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ keywords: [] });

    const data = await res.json();
    // Movie returns { keywords: [...] }, TV returns { results: [...] }
    const raw: { name: string }[] = data.keywords ?? data.results ?? [];
    const keywords = raw.map((k) => k.name).filter(Boolean);

    return NextResponse.json({ keywords });
  } catch {
    return NextResponse.json({ keywords: [] });
  }
}
