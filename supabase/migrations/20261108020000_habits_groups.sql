-- ---------------------------------------------------------------------------
-- Study habits per account, and study groups.
--
-- study_habits: the days a reader studied on (the streak), their exam date per
-- course, and whether they asked for study reminders by email. The browser keeps
-- the same data; for a signed-in reader it is merged with this row on arrival and
-- written back as it changes (study-mode/progress-sync.tsx).
--
-- study_groups / study_group_members: a few friends studying for the same exam.
-- A group is created and joined only through the functions below (an invite code
-- joins it); members see the group and each other, and each member decides
-- whether their readiness is shown. Nobody outside a group sees anything of it.
-- ---------------------------------------------------------------------------

create table public.study_habits (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  days       integer[] not null default '{}' check (cardinality(days) <= 60),
  exams      jsonb not null default '{}'::jsonb check (jsonb_typeof(exams) = 'object' and pg_column_size(exams) < 4096),
  -- Opt-in only: no reminder is ever sent unless the reader turned this on.
  reminders  boolean not null default false,
  -- The last day a reminder went out (see dayOf in lib/study/review.ts), so one goes at most once a day.
  reminded_on integer,
  updated_at timestamptz not null default now()
);

create trigger study_habits_updated_at
  before update on public.study_habits
  for each row execute function public.set_updated_at();

alter table public.study_habits enable row level security;

create policy "Users read their own habits"
  on public.study_habits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users record their own habits"
  on public.study_habits for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own habits"
  on public.study_habits for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Study groups
-- ---------------------------------------------------------------------------
create table public.study_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  course      text not null check (course ~ '^[a-z0-9-]{1,40}$'),
  exam_date   date,
  owner       uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[a-z0-9]{10}$'),
  created_at  timestamptz not null default now()
);

create table public.study_group_members (
  group_id       uuid not null references public.study_groups (id) on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 40),
  -- Off by default: a member's readiness and streak show only if they choose.
  share_progress boolean not null default false,
  readiness      smallint check (readiness between 0 and 100),
  streak         smallint check (streak between 0 and 400),
  studied_on     integer,
  joined_at      timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index study_group_members_user_idx on public.study_group_members (user_id);

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;

-- Membership, read past the members table's own rules (a policy on it can't query it again).
create or replace function public.is_group_member(g uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.study_group_members m where m.group_id = g and m.user_id = (select auth.uid()));
$$;

create policy "Members see their groups"
  on public.study_groups for select to authenticated
  using (public.is_group_member(id));
create policy "The owner edits the group"
  on public.study_groups for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);
create policy "The owner deletes the group"
  on public.study_groups for delete to authenticated
  using ((select auth.uid()) = owner);

create policy "Members see each other"
  on public.study_group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy "Members update their own row"
  on public.study_group_members for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Members leave"
  on public.study_group_members for delete to authenticated
  using ((select auth.uid()) = user_id);

-- A new group, with its owner as the first member. Returns the group's id and invite code.
create or replace function public.create_study_group(p_name text, p_course text, p_exam_date date, p_display_name text)
returns table (id uuid, invite_code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  g uuid;
  code text;
begin
  if me is null then raise exception 'not signed in'; end if;
  if (select count(*) from public.study_groups s where s.owner = me) >= 10 then raise exception 'too many groups'; end if;
  code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  insert into public.study_groups (name, course, exam_date, owner, invite_code)
  values (btrim(p_name), p_course, p_exam_date, me, code)
  returning study_groups.id into g;
  insert into public.study_group_members (group_id, user_id, display_name) values (g, me, btrim(p_display_name));
  return query select g, code;
end;
$$;

-- Join by invite code. Joining twice is a no-op; a group holds at most 30 members.
create or replace function public.join_study_group(p_code text, p_display_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  g uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  select s.id into g from public.study_groups s where s.invite_code = lower(btrim(p_code));
  if g is null then raise exception 'no such group'; end if;
  if exists (select 1 from public.study_group_members m where m.group_id = g and m.user_id = me) then return g; end if;
  if (select count(*) from public.study_group_members m where m.group_id = g) >= 30 then raise exception 'group is full'; end if;
  insert into public.study_group_members (group_id, user_id, display_name) values (g, me, btrim(p_display_name));
  return g;
end;
$$;

revoke execute on function public.create_study_group(text, text, date, text) from public, anon;
revoke execute on function public.join_study_group(text, text) from public, anon;
grant execute on function public.create_study_group(text, text, date, text) to authenticated;
grant execute on function public.join_study_group(text, text) to authenticated;

-- What an invite shows before joining: the group's name, course, exam date and size — nothing about its members.
create or replace function public.study_group_preview(p_code text)
returns table (name text, course text, exam_date date, members integer)
language sql
stable
security definer
set search_path = ''
as $$
  select s.name, s.course, s.exam_date, (select count(*)::integer from public.study_group_members m where m.group_id = s.id)
  from public.study_groups s
  where s.invite_code = lower(btrim(p_code)) and (select auth.uid()) is not null;
$$;

revoke execute on function public.study_group_preview(text) from public, anon;
grant execute on function public.study_group_preview(text) to authenticated;
