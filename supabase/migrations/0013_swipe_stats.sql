-- Daily time-series swipe counts (one row per calendar day)
CREATE TABLE IF NOT EXISTS swipe_stats_daily (
  date             date        PRIMARY KEY DEFAULT CURRENT_DATE,
  swipes_left      bigint      NOT NULL DEFAULT 0,
  swipes_right     bigint      NOT NULL DEFAULT 0,
  swipes_up        bigint      NOT NULL DEFAULT 0,
  active_sessions  bigint      NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- Single-row lifetime totals for fast all-time reads
CREATE TABLE IF NOT EXISTS swipe_stats_totals (
  id               int         PRIMARY KEY DEFAULT 1,
  swipes_left      bigint      NOT NULL DEFAULT 0,
  swipes_right     bigint      NOT NULL DEFAULT 0,
  swipes_up        bigint      NOT NULL DEFAULT 0,
  active_sessions  bigint      NOT NULL DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

-- Seed the single totals row
INSERT INTO swipe_stats_totals (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS: anon and authenticated users can upsert/update stats rows.
-- No SELECT policy from client — reads happen via service role only.
ALTER TABLE swipe_stats_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_stats_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_upsert_daily"
  ON swipe_stats_daily
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_update_totals"
  ON swipe_stats_totals
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
