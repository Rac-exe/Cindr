-- Cindr UX/Data correction: independent list flags.
-- status remains for compatibility but app logic should use these booleans.

alter table public.saved_movies
  add column if not exists watchlisted boolean not null default false,
  add column if not exists favourite boolean not null default false,
  add column if not exists watched boolean not null default false;

update public.saved_movies
set
  watchlisted = watchlisted or status = 'saved',
  favourite = favourite or status = 'favourite',
  watched = watched or status = 'watched'
where status is not null;

create index if not exists saved_movies_user_watchlisted
  on public.saved_movies (user_id, watchlisted)
  where watchlisted = true;

create index if not exists saved_movies_user_favourite
  on public.saved_movies (user_id, favourite)
  where favourite = true;

create index if not exists saved_movies_user_watched
  on public.saved_movies (user_id, watched)
  where watched = true;
