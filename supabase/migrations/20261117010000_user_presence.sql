-- ---------------------------------------------------------------------------
-- Who is on the site right now.
--
-- user_presence: one row per signed-in account, touched about once a minute
-- while the site is open and in view in one of its tabs (components/layout/
-- presence-ping.tsx), with the page it was on. /admin/users reads it: "active
-- now" is a touch in the last two minutes; otherwise it shows when the account
-- was last active, to the minute. An account writes only its own row; admins
-- read every row.
-- ---------------------------------------------------------------------------
create table public.user_presence (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  last_active_at timestamptz not null default now(),
  path           text check (path is null or char_length(path) <= 300)
);

alter table public.user_presence enable row level security;

create policy "Accounts record their own presence"
  on public.user_presence for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Accounts update their own presence"
  on public.user_presence for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Accounts read their own presence; admins read all"
  on public.user_presence for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
