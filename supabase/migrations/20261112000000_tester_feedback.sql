-- ---------------------------------------------------------------------------
-- Testers and their feedback.
--
-- testers: the accounts an admin marked as course testers (by email, in
-- /admin/feedback). Only an admin adds or removes one; a tester can see that
-- they are one, which is what shows them the floating "משוב" button and opens
-- the feedback form (/tester) to them.
--
-- tester_feedback: one row per tester, the whole feedback form as the site
-- stores it (lib/tester/form.ts). The tester's browser keeps a copy too; it
-- writes here as they fill it in, from the full form or the floating button
-- inside the lessons, so the feedback reaches the team without being sent by
-- hand and follows the tester to every device. Only a tester writes a row, and
-- only their own; admins read every row. Removing a tester keeps what they wrote.
-- ---------------------------------------------------------------------------
create table public.testers (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.testers enable row level security;

create policy "Testers see themselves; admins see all"
  on public.testers for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
create policy "Admins add testers"
  on public.testers for insert to authenticated
  with check (public.is_admin());
create policy "Admins remove testers"
  on public.testers for delete to authenticated
  using (public.is_admin());

create or replace function public.is_tester()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.testers where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_tester() from public, anon;
grant execute on function public.is_tester() to authenticated;

create table public.tester_feedback (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  answers    jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 262144),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tester_feedback_updated_at
  before update on public.tester_feedback
  for each row execute function public.set_updated_at();

alter table public.tester_feedback enable row level security;

create policy "Testers read their own feedback; admins read all"
  on public.tester_feedback for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
create policy "Testers record their own feedback"
  on public.tester_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_tester());
create policy "Testers update their own feedback"
  on public.tester_feedback for update to authenticated
  using ((select auth.uid()) = user_id and public.is_tester())
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Admin: every tester with their email and name, and when they last wrote.
-- auth.users is not readable through the API, so this runs as definer and
-- checks the caller itself (as admin_subscriptions does).
-- ---------------------------------------------------------------------------
create or replace function public.admin_testers()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return coalesce((
    select jsonb_agg(t order by t."addedAt" desc) from (
      select te.user_id as "userId", u.email, coalesce(p.full_name, '') as "fullName",
             te.added_at as "addedAt", f.updated_at as "lastFeedbackAt"
      from public.testers te
      join auth.users u on u.id = te.user_id
      left join public.profiles p on p.id = te.user_id
      left join public.tester_feedback f on f.user_id = te.user_id
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_testers() from public, anon;
grant execute on function public.admin_testers() to authenticated;
