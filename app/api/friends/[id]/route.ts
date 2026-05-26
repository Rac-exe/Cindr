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
 * PATCH /api/friends/[id]
 * Body: { accept: boolean }  → accept or decline a pending request
 * Body: { remove: true }     → unfriend
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = serviceClient();

  try {
    if (body.remove === true) {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("friendships")
        .update({ status: body.accept === true ? "accepted" : "declined" })
        .eq("id", id)
        .eq("addressee_id", user.id);
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[PATCH /api/friends/${id}]`, err);
    return NextResponse.json({ error: "Failed to update friendship" }, { status: 500 });
  }
}
