import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/tmdb/client";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const data = await searchPeople(query);
    const results = data.results.slice(0, 8).map((person) => ({
      id: person.id,
      name: person.name,
      knownFor: person.known_for
        ?.map((item) => item.title ?? item.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", "),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("TMDB person search error:", error);
    return NextResponse.json(
      { error: "Failed to search people", results: [] },
      { status: 500 }
    );
  }
}
