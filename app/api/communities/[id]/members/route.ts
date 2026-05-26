import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/communities/[id]/members?page=0 — paginated member list */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const page = Number(req.nextUrl.searchParams.get("page") ?? "0");
  const PAGE_SIZE = 20;
  const offset = (isNaN(page) ? 0 : page) * PAGE_SIZE;

  try {
    const supabase = serviceClient();

    const { data, error } = await supabase
      .from("community_members")
      .select("user_id, joined_at, profiles(display_name, avatar_url)")
      .eq("community_id", id)
      .order("joined_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);

    const members = (data ?? []).map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        user_id: row.user_id,
        display_name: (p as { display_name: string | null } | null)?.display_name ?? "Unknown",
        avatar_url: (p as { avatar_url: string | null } | null)?.avatar_url ?? null,
        joined_at: row.joined_at,
      };
    });

    return NextResponse.json({ members });
  } catch (err) {
    console.error(`[GET /api/communities/${id}/members]`, err);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
