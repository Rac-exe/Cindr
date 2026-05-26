import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCommunities } from "@/lib/supabase/social";

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

/** GET /api/communities — list all communities with joined status */
export async function GET(_req: NextRequest) {
  try {
    // Verify session (optional — communities are public, but is_member needs auth)
    const supabase = createSupabaseServerClient();
    await supabase.auth.getUser(); // establishes session context for RLS

    const communities = await getCommunities();
    return NextResponse.json({ communities });
  } catch (err) {
    console.error("[GET /api/communities]", err);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
