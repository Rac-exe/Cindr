import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/tmdb/client";

export async function GET(request: NextRequest) {
  try {
    const query =
      request.nextUrl.searchParams.get("query")?.trim().replace(/\s+/g, " ") ??
      "";
    const role = request.nextUrl.searchParams.get("role");
    const preferredDepartment =
      role === "director" ? "Directing" : role === "actor" ? "Acting" : null;

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const data = await searchPeople(query.slice(0, 80));
    const sortedResults = preferredDepartment
      ? [...data.results].sort((a, b) => {
          const aMatches = a.known_for_department === preferredDepartment;
          const bMatches = b.known_for_department === preferredDepartment;
          return Number(bMatches) - Number(aMatches);
        })
      : data.results;
    const results = sortedResults.slice(0, 8).map((person) => ({
      id: person.id,
      name: person.name,
      department: person.known_for_department,
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
