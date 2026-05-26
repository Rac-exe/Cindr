import { NextRequest, NextResponse } from "next/server";
import { getCommunityMembers } from "@/lib/supabase/social";

interface RouteParams {
  params: { id: string };
}

/** GET /api/communities/[id]/members?page=0 — paginated member list */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const page = Number(req.nextUrl.searchParams.get("page") ?? "0");

  try {
    const members = await getCommunityMembers(params.id, isNaN(page) ? 0 : page);
    return NextResponse.json({ members });
  } catch (err) {
    console.error(`[GET /api/communities/${params.id}/members]`, err);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
