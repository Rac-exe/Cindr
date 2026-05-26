import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function requireUser(req: NextRequest) {
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/communities/[id]/join
 * Headers: Authorization: Bearer <token>
 * Body: { action: "join" | "leave" }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json().catch(() => ({ action: "join" }));
  const supabase = serviceClient();

  try {
    if (action === "leave") {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", id)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: id, user_id: user.id });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[POST /api/communities/${id}/join]`, err);
    return NextResponse.json({ error: "Failed to update membership" }, { status: 500 });
  }
}
