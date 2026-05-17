-- Cindr Core MVP Schema
-- Apply this migration in the Supabase SQL Editor or via `supabase db push`.

-- =============================================================================
-- 1. Helper: auto-update updated_at columns
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- 2. profiles — created automatically when a user signs up
-- =============================================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  date_of_birth date,
  is_adult     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auth trigger: auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, date_of_birth, is_adult)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    (new.raw_user_meta_data->>'date_of_birth')::date,
    coalesce((new.raw_user_meta_data->>'is_adult')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 3. user_preferences — onboarding choices synced from guest state
-- =============================================================================
create table public.user_preferences (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  languages           text[] not null default '{}',
  genres              int[]  not null default '{}',
  moods               text[] not null default '{}',
  content_types       text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 4. saved_movies — watchlist / favourites / watched
-- =============================================================================
create type public.saved_movie_status as enum ('saved', 'favourite', 'watched');

create table public.saved_movies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tmdb_id     int  not null,
  media_type  text not null default 'movie' check (media_type in ('movie', 'tv')),
  title       text not null,
  poster_path text,
  status      public.saved_movie_status not null default 'saved',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, tmdb_id, media_type)
);

alter table public.saved_movies enable row level security;

create policy "Users can view own saved movies"
  on public.saved_movies for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved movies"
  on public.saved_movies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved movies"
  on public.saved_movies for update
  using (auth.uid() = user_id);

create policy "Users can delete own saved movies"
  on public.saved_movies for delete
  using (auth.uid() = user_id);

create index saved_movies_user_status on public.saved_movies (user_id, status);

create trigger saved_movies_updated_at
  before update on public.saved_movies
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 5. swipe_history — track swiped content for logged-in users
-- =============================================================================
create table public.swipe_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tmdb_id    int  not null,
  media_type text not null default 'movie' check (media_type in ('movie', 'tv')),
  direction  text not null check (direction in ('left', 'right')),
  title      text,
  poster_path text,
  created_at timestamptz not null default now(),

  unique (user_id, tmdb_id, media_type)
);

alter table public.swipe_history enable row level security;

create policy "Users can view own swipe history"
  on public.swipe_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own swipe history"
  on public.swipe_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own swipe history"
  on public.swipe_history for update
  using (auth.uid() = user_id);

create index swipe_history_user on public.swipe_history (user_id);

-- =============================================================================
-- Done. All tables have RLS enabled and per-user policies.
-- =============================================================================
