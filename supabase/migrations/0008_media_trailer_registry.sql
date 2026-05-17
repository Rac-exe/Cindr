-- Permanent trailer registry for TMDB media.
-- This is intentionally not an expiring cache: one canonical row per item.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.media_trailer_registry (
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  release_year int,
  youtube_key text,
  youtube_url text generated always as (
    case
      when youtube_key is null then null
      else 'https://www.youtube.com/watch?v=' || youtube_key
    end
  ) stored,
  source text not null default 'none' check (source in ('tmdb', 'youtube', 'none')),
  status text not null default 'no_trailer' check (status in ('ready', 'no_trailer', 'error')),
  resolved_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tmdb_id, media_type),
  check (
    (status = 'ready' and youtube_key is not null and source in ('tmdb', 'youtube'))
    or (status in ('no_trailer', 'error') and youtube_key is null and source = 'none')
  )
);

alter table public.media_trailer_registry enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'media_trailer_registry'
      and policyname = 'Anyone can read resolved trailer registry'
  ) then
    create policy "Anyone can read resolved trailer registry"
      on public.media_trailer_registry for select
      using (status in ('ready', 'no_trailer'));
  end if;
end $$;

create index if not exists media_trailer_registry_status_last_checked_at
  on public.media_trailer_registry (status, last_checked_at desc);

create index if not exists media_trailer_registry_source_status
  on public.media_trailer_registry (source, status);

drop trigger if exists media_trailer_registry_updated_at on public.media_trailer_registry;
create trigger media_trailer_registry_updated_at
  before update on public.media_trailer_registry
  for each row execute function public.set_updated_at();
