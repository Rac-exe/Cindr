-- Cindr feedback and issue reports.

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('feedback', 'issue')),
  message text not null,
  page_path text,
  user_agent text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.feedback_reports enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_reports'
      and policyname = 'Users can submit feedback reports'
  ) then
    create policy "Users can submit feedback reports"
      on public.feedback_reports for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_reports'
      and policyname = 'Users can view own feedback reports'
  ) then
    create policy "Users can view own feedback reports"
      on public.feedback_reports for select
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists feedback_reports_user_created_at
  on public.feedback_reports (user_id, created_at desc);

create index if not exists feedback_reports_status_created_at
  on public.feedback_reports (status, created_at desc);
