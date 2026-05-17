-- Cindr v2: ratings, likes, and simplified swipe persistence

-- saved_movies now acts as the user's interaction row for a title:
-- right-swipe interest, explicit save/favourite/watched status, and rating.
alter table public.saved_movies
  add column if not exists liked boolean not null default false,
  add column if not exists rating smallint;

alter table public.saved_movies
  alter column status drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_movies_rating_range'
      and conrelid = 'public.saved_movies'::regclass
  ) then
    alter table public.saved_movies
      add constraint saved_movies_rating_range
      check (rating is null or (rating >= 1 and rating <= 10));
  end if;
end $$;

create index if not exists saved_movies_user_liked
  on public.saved_movies (user_id, liked);

create index if not exists saved_movies_user_rating
  on public.saved_movies (user_id, rating)
  where rating is not null;

drop table if exists public.swipe_history;
