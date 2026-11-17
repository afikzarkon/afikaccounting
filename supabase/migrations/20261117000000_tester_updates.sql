-- ---------------------------------------------------------------------------
-- Updates for testers: what changed in the course they test while they test it.
--
-- The site finds the changes itself. tester_content_baselines keeps, per
-- course, a fingerprint of every lesson as it was when the admin last decided
-- about its changes (lib/tester/fingerprint.ts: each concept screen, practice
-- question, trap, tip and video). /admin/feedback compares the live lessons to
-- it and offers the difference as a ready update, in words; the admin publishes
-- it or skips it, and either way the fingerprint moves on.
--
-- tester_updates: a published update. course_id names the course it is about:
-- only testers who were given that course (public.course_grants) see it; null
-- is for every tester. Only an admin writes, edits or removes one.
--
-- tester_update_reads: which tester has seen which update. A tester sees the
-- updates for their courses published after they were marked a tester and not
-- yet seen, in a window that opens the first time they load the site after it
-- was published; closing it marks them seen. Admins read every row.
-- ---------------------------------------------------------------------------
create table public.tester_updates (
  id         uuid primary key default gen_random_uuid(),
  course_id  text check (course_id is null or char_length(course_id) <= 40),
  title      text not null check (char_length(title) between 1 and 120),
  body       text not null default '' check (char_length(body) <= 4000),
  link_href  text check (link_href is null or (link_href like '/%' and char_length(link_href) <= 300)),
  link_label text check (link_label is null or char_length(link_label) <= 60),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);

create index tester_updates_course_idx on public.tester_updates (course_id, created_at desc);

alter table public.tester_updates enable row level security;

create policy "Testers and admins read updates"
  on public.tester_updates for select to authenticated
  using (public.is_tester() or public.is_admin());
create policy "Admins publish updates"
  on public.tester_updates for insert to authenticated
  with check (public.is_admin());
create policy "Admins edit updates"
  on public.tester_updates for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins remove updates"
  on public.tester_updates for delete to authenticated
  using (public.is_admin());

create table public.tester_update_reads (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  update_id uuid not null references public.tester_updates (id) on delete cascade,
  seen_at   timestamptz not null default now(),
  primary key (user_id, update_id)
);

create index tester_update_reads_update_idx on public.tester_update_reads (update_id);

alter table public.tester_update_reads enable row level security;

create policy "Testers read what they saw; admins read all"
  on public.tester_update_reads for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());
create policy "Testers mark updates seen"
  on public.tester_update_reads for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_tester());

-- The latest row per course is the one compared against; older rows are its history.
create table public.tester_content_baselines (
  id          uuid primary key default gen_random_uuid(),
  course_id   text not null check (char_length(course_id) <= 40),
  fingerprint jsonb not null check (jsonb_typeof(fingerprint) = 'object' and pg_column_size(fingerprint) < 1048576),
  -- 'start' (the first look), 'published' or 'skipped'.
  decision    text not null check (decision in ('start', 'published', 'skipped')),
  update_id   uuid references public.tester_updates (id) on delete set null,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);

create index tester_content_baselines_course_idx on public.tester_content_baselines (course_id, created_at desc);

alter table public.tester_content_baselines enable row level security;

create policy "Admins read baselines"
  on public.tester_content_baselines for select to authenticated
  using (public.is_admin());
create policy "Admins record baselines"
  on public.tester_content_baselines for insert to authenticated
  with check (public.is_admin());
