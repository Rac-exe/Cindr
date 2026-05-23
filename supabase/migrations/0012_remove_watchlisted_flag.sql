-- Remove the obsolete standalone watchlist/list flag.
-- The app now uses liked, favourite, and watched as the only saved-movie buckets.

drop index if exists public.saved_movies_user_watchlisted;

alter table public.saved_movies
  drop column if exists watchlisted;
