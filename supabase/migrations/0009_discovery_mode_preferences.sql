-- Cindr discovery mode and explicit quiz filter preferences.

alter table public.user_preferences
  add column if not exists discover_mode text not null default 'taste',
  add column if not exists era text not null default 'any',
  add column if not exists runtime_preference text not null default 'any';

alter table public.user_preferences
  drop constraint if exists user_preferences_discover_mode_check,
  drop constraint if exists user_preferences_era_check,
  drop constraint if exists user_preferences_runtime_preference_check;

alter table public.user_preferences
  add constraint user_preferences_discover_mode_check
    check (discover_mode in ('taste', 'random')),
  add constraint user_preferences_era_check
    check (era in ('new', 'modern', 'classic', 'any')),
  add constraint user_preferences_runtime_preference_check
    check (runtime_preference in ('short', 'medium', 'long', 'any'));
