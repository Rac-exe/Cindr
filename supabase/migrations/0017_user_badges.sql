-- Cindr social layer: user badges (earned achievements)

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   text        NOT NULL,
  earned_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON public.user_badges (user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can read badges (public profiles)
CREATE POLICY "public_read_badges"
  ON public.user_badges FOR SELECT USING (true);

-- Users can only insert their own badges (enforced server-side too)
CREATE POLICY "users_insert_own_badges"
  ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
