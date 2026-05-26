-- Cindr social layer: communities and community membership

CREATE TABLE IF NOT EXISTS public.communities (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        UNIQUE NOT NULL,
  name         text        NOT NULL,
  description  text,
  genre_tags   text[]      DEFAULT '{}',
  accent_color text        DEFAULT '#D85A30',
  member_count bigint      NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id  uuid        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at     timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_members_user_idx ON public.community_members (user_id);

-- Keep member_count in sync automatically
CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER community_member_count_sync
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_count();

-- RLS
ALTER TABLE public.communities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members  ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read communities
CREATE POLICY "public_read_communities"
  ON public.communities FOR SELECT USING (true);

-- Authenticated users can read all membership rows
CREATE POLICY "auth_read_members"
  ON public.community_members FOR SELECT TO authenticated USING (true);

-- Users can join (insert their own row)
CREATE POLICY "users_join_community"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave (delete their own row)
CREATE POLICY "users_leave_community"
  ON public.community_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Seed: 7 default genre communities ─────────────────────────────────────
INSERT INTO public.communities (slug, name, description, genre_tags, accent_color) VALUES
  ('horror-heads',    'Horror Heads',    'For those who like their movies dark, tense, and terrifying.',                          ARRAY['Horror', 'Thriller'],          '#ef4444'),
  ('anime-otaku',     'Anime Otaku',     'From isekai to slice-of-life — if it is animated and Japanese, it belongs here.',       ARRAY['Anime', 'Animation'],          '#a78bfa'),
  ('thriller-minds',  'Thriller Minds',  'Crime, psychological, neo-noir — movies that mess with your head.',                     ARRAY['Thriller', 'Crime', 'Mystery'], '#f59e0b'),
  ('sci-fi-frontier', 'Sci-Fi Frontier', 'Space operas, dystopias, time travel — science fiction in all its forms.',              ARRAY['Sci-Fi', 'Fantasy'],            '#38bdf8'),
  ('drama-club',      'Drama Club',      'Character-driven stories, gut-punch endings, and films that stay with you.',            ARRAY['Drama'],                        '#34d399'),
  ('action-arena',    'Action Arena',    'Explosions, stunts, and adrenaline. No slow burns allowed.',                            ARRAY['Action', 'Adventure'],         '#f97316'),
  ('rom-com-fans',    'Rom-Com Fans',    'Love stories, meet-cutes, and the occasional ugly cry. All welcome.',                   ARRAY['Romance', 'Comedy'],            '#f472b6')
ON CONFLICT (slug) DO NOTHING;
