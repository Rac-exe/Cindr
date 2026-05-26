import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { respondToRequest, removeFriend } from "@/lib/supabase/social";

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

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/friends/[id]
 * Body: { accept: boolean }  → accept or decline a pending request
 * Body: { remove: true }     → unfriend (delete accepted friendship)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    if (body.remove === true) {
      await removeFriend(params.id);
    } else {
      await respondToRequest(params.id, body.accept === true);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[PATCH /api/friends/${params.id}]`, err);
    return NextResponse.json({ error: "Failed to update friendship" }, { status: 500 });
  }
}
