import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getUserFromToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  return user ?? null;
}

/** GET /api/communities — list all communities with joined status */
export async function GET(req: NextRequest) {
  try {
    const supabase = serviceClient();

    const { data: communities, error } = await supabase
      .from("communities")
      .select("*")
      .order("member_count", { ascending: false });

    if (error) throw new Error(error.message);

    // Optionally populate is_member
    const user = await getUserFromToken(req);
    if (user) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const joined = new Set((memberships ?? []).map((m: { community_id: string }) => m.community_id));
      const enriched = (communities ?? []).map((c) => ({ ...c, is_member: joined.has(c.id) }));
      return NextResponse.json({ communities: enriched });
    }

    return NextResponse.json({ communities: communities ?? [] });
  } catch (err) {
    console.error("[GET /api/communities]", err);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
