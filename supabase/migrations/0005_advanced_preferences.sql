-- Cindr Advanced Filters: year range and people preferences.

alter table public.user_preferences
  add column if not exists year_from int,
  add column if not exists year_to int,
  add column if not exists people jsonb not null default '[]'::jsonb;

alter table public.user_preferences
  drop constraint if exists user_preferences_year_range_check;

alter table public.user_preferences
  add constraint user_preferences_year_range_check
  check (
    (year_from is null or (year_from between 1870 and 2100))
    and (year_to is null or (year_to between 1870 and 2100))
    and (year_from is null or year_to is null or year_from <= year_to)
  );
