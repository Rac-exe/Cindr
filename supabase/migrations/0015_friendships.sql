-- Cindr social layer: friendships between users

CREATE TABLE IF NOT EXISTS public.friendships (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships (requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships (addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see rows where they are either party
CREATE POLICY "users_see_own_friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can insert as the requester only
CREATE POLICY "users_insert_own_requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- Addressee can update status; requester cannot change their own request
CREATE POLICY "addressee_can_respond"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (addressee_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid());

-- Either party can delete (withdraw or unfriend)
CREATE POLICY "either_party_can_delete"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_friendship_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.touch_friendship_updated_at();
