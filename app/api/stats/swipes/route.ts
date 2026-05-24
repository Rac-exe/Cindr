import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_PER_FLUSH = 500;

function clamp(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(Math.floor(v), MAX_PER_FLUSH);
}

// Service-role client — bypasses RLS, server-side only
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const left       = clamp(body.left);
    const right      = clamp(body.right);
    const up         = clamp(body.up);
    const newSession = body.newSession === true ? 1 : 0;

    // Nothing to record
    if (left + right + up + newSession === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = serviceClient();
    const today    = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    await Promise.all([
      // Upsert today's daily row, incrementing counters atomically
      supabase.rpc("increment_swipe_stats_daily", {
        p_date:            today,
        p_left:            left,
        p_right:           right,
        p_up:              up,
        p_active_sessions: newSession,
      }),

      // Increment the lifetime totals row
      supabase.rpc("increment_swipe_stats_totals", {
        p_left:            left,
        p_right:           right,
        p_up:              up,
        p_active_sessions: newSession,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never surface errors to the client — analytics must never break the app
    console.error("[swipe-stats]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
