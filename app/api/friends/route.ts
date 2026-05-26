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

/** GET /api/friends — returns { friends, pending } for the current user */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();

  try {
    // Accepted friends
    const { data: accepted, error: e1 } = await supabase
      .from("friendships")
      .select(`
        id, requester_id, addressee_id, status, created_at, updated_at,
        requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_url)
      `)
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (e1) throw new Error(e1.message);

    // Pending requests addressed to current user
    const { data: pendingRows, error: e2 } = await supabase
      .from("friendships")
      .select(`
        id, requester_id, addressee_id, status, created_at, updated_at,
        requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_url)
      `)
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (e2) throw new Error(e2.message);

    function toFriendProfile(row: Record<string, unknown>, isRequester: boolean) {
      const other = isRequester
        ? (Array.isArray(row.addressee) ? (row.addressee as unknown[])[0] : row.addressee)
        : (Array.isArray(row.requester) ? (row.requester as unknown[])[0] : row.requester);
      const o = other as { id: string; display_name: string | null; avatar_url: string | null } | null;
      return {
        id: o?.id ?? "",
        display_name: o?.display_name ?? "Unknown",
        avatar_url: o?.avatar_url ?? null,
        friendship: {
          id: row.id,
          requester_id: row.requester_id,
          addressee_id: row.addressee_id,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    }

    const friends = (accepted ?? []).map((row) =>
      toFriendProfile(row as Record<string, unknown>, row.requester_id === user.id)
    );
    const pending = (pendingRows ?? []).map((row) =>
      toFriendProfile(row as Record<string, unknown>, false)
    );

    return NextResponse.json({ friends, pending });
  } catch (err) {
    console.error("[GET /api/friends]", err);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

/**
 * POST /api/friends
 * Body: { addressee_id: string }
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { addressee_id } = body as { addressee_id?: string };

  if (!addressee_id) {
    return NextResponse.json({ error: "addressee_id is required" }, { status: 400 });
  }
  if (addressee_id === user.id) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const supabase = serviceClient();
  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id,
  });

  if (error && !error.message.includes("duplicate")) {
    console.error("[POST /api/friends]", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
