import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  type MediaTrailerRegistryRow,
  type MediaType,
  resolveTrailer,
  toTrailerPayload,
} from "@/lib/trailers/resolveTrailer";

function parseMediaType(value: string | null): MediaType | null {
  if (value === "movie" || value === null) return "movie";
  if (value === "tv") return "tv";
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);
    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const mediaType = parseMediaType(request.nextUrl.searchParams.get("type"));
    if (!mediaType) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: selectError } = await supabase
      .from("media_trailer_registry")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      return NextResponse.json(
        toTrailerPayload(existing as MediaTrailerRegistryRow)
      );
    }

    const details =
      mediaType === "tv"
        ? await getTVDetails(tmdbId)
        : await getMovieDetails(tmdbId);
    const resolution = await resolveTrailer(details);
    const now = new Date().toISOString();

    const { data: saved, error: upsertError } = await supabase
      .from("media_trailer_registry")
      .upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          title: resolution.title,
          release_year: resolution.releaseYear,
          youtube_key: resolution.youtubeKey,
          source: resolution.source,
          status: resolution.status,
          resolved_at: now,
          last_checked_at: now,
          last_error: resolution.lastError ?? null,
        },
        { onConflict: "tmdb_id,media_type" }
      )
      .select("*")
      .single();

    if (upsertError) throw upsertError;

    return NextResponse.json(toTrailerPayload(saved as MediaTrailerRegistryRow));
  } catch (error) {
    console.error("Trailer registry error:", error);
    return NextResponse.json(
      { error: "Failed to resolve trailer" },
      { status: 500 }
    );
  }
}
