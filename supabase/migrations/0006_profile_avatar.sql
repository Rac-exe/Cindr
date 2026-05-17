-- Cindr profile avatars stored in Cloudinary.

alter table public.profiles
  add column if not exists avatar_public_id text,
  add column if not exists avatar_url text;
