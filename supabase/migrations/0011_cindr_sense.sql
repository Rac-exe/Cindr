-- CindrSense: persist taste fingerprints per user so the learned
-- recommendation profile survives across devices and browser clears.

CREATE TABLE IF NOT EXISTS public.taste_fingerprints (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint JSONB      NOT NULL DEFAULT '{}',
  swipe_count INTEGER    NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.taste_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own fingerprint select"
  ON public.taste_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own fingerprint insert"
  ON public.taste_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own fingerprint update"
  ON public.taste_fingerprints FOR UPDATE
  USING (auth.uid() = user_id);
