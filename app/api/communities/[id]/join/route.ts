import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { joinCommunity, leaveCommunity } from "@/lib/supabase/social";

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
 * POST /api/communities/[id]/join
 * Body: { action: "join" | "leave" }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json().catch(() => ({ action: "join" }));

  try {
    if (action === "leave") {
      await leaveCommunity(params.id);
    } else {
      await joinCommunity(params.id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[POST /api/communities/${params.id}/join]`, err);
    return NextResponse.json({ error: "Failed to update membership" }, { status: 500 });
  }
}
