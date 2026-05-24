-- Atomic increment for daily swipe stats (upsert by date)
CREATE OR REPLACE FUNCTION increment_swipe_stats_daily(
  p_date            date,
  p_left            bigint,
  p_right           bigint,
  p_up              bigint,
  p_active_sessions bigint
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO swipe_stats_daily (date, swipes_left, swipes_right, swipes_up, active_sessions)
  VALUES (p_date, p_left, p_right, p_up, p_active_sessions)
  ON CONFLICT (date) DO UPDATE SET
    swipes_left     = swipe_stats_daily.swipes_left     + EXCLUDED.swipes_left,
    swipes_right    = swipe_stats_daily.swipes_right    + EXCLUDED.swipes_right,
    swipes_up       = swipe_stats_daily.swipes_up       + EXCLUDED.swipes_up,
    active_sessions = swipe_stats_daily.active_sessions + EXCLUDED.active_sessions;
END;
$$;

-- Atomic increment for lifetime totals
CREATE OR REPLACE FUNCTION increment_swipe_stats_totals(
  p_left            bigint,
  p_right           bigint,
  p_up              bigint,
  p_active_sessions bigint
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE swipe_stats_totals SET
    swipes_left     = swipes_left     + p_left,
    swipes_right    = swipes_right    + p_right,
    swipes_up       = swipes_up       + p_up,
    active_sessions = active_sessions + p_active_sessions,
    updated_at      = now()
  WHERE id = 1;
END;
$$;

-- Allow anon and authenticated roles to call these functions
GRANT EXECUTE ON FUNCTION increment_swipe_stats_daily  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_swipe_stats_totals TO anon, authenticated;
