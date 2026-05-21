-- Allow guests to submit feedback while keeping signed-in ownership intact.

alter table public.feedback_reports
  alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_reports'
      and policyname = 'Guests can submit feedback reports'
  ) then
    create policy "Guests can submit feedback reports"
      on public.feedback_reports for insert
      with check (user_id is null);
  end if;
end $$;

create index if not exists feedback_reports_guest_created_at
  on public.feedback_reports (created_at desc)
  where user_id is null;
