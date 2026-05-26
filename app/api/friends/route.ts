import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getFriends, getPendingRequests, sendFriendRequest } from "@/lib/supabase/social";

function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/** GET /api/friends — returns { friends, pending } for the current user */
export async function GET(_req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [friends, pending] = await Promise.all([getFriends(), getPendingRequests()]);
    return NextResponse.json({ friends, pending });
  } catch (err) {
    console.error("[GET /api/friends]", err);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

/**
 * POST /api/friends
 * Body: { addressee_id: string }
 * Sends a friend request to addressee_id.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { addressee_id } = body as { addressee_id?: string };

  if (!addressee_id) {
    return NextResponse.json({ error: "addressee_id is required" }, { status: 400 });
  }

  try {
    await sendFriendRequest(addressee_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/friends]", err);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
