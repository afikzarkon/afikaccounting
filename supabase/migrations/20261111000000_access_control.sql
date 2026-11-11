-- AfikAccounting — closed site: manual approval and per-course access.
-- Apply after 20261108060000_admin_ambassadors.sql.
--
-- Every new account starts "pending" and sees nothing but a waiting page until
-- an admin approves it. An approved account opens only the courses an admin
-- granted it (public.course_grants). An admin is never pending and opens everything.
-- The proxy reads all of it in one call per request (public.access_state()).

-- ---------------------------------------------------------------------------
-- Approval status on the profile
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Course grants: which courses (catalog topic ids) an account may open
-- ---------------------------------------------------------------------------
create table public.course_grants (
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- A topic id from src/lib/catalog.ts ("basics", "inventory", "ias16", …); the app checks it against the catalog.
  course_id  text not null check (course_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(course_id) <= 40),
  granted_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.course_grants enable row level security;

create policy "Readers see their own course grants"
  on public.course_grants for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read every course grant"
  on public.course_grants for select to authenticated
  using (public.is_admin());
create policy "Admins grant courses"
  on public.course_grants for insert to authenticated
  with check (public.is_admin());
create policy "Admins revoke courses"
  on public.course_grants for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Existing accounts keep exactly what they could open before the site closed:
-- approved, the free course, and every course when they hold a live plan.
-- New accounts (from here on) start pending with no courses.
-- ---------------------------------------------------------------------------
update public.profiles set approval_status = 'approved', reviewed_at = now();

insert into public.course_grants (user_id, course_id, granted_by)
select p.id, 'basics', null from public.profiles p
on conflict do nothing;

insert into public.course_grants (user_id, course_id, granted_by)
select s.user_id, c.course_id, null
from public.subscriptions s
cross join (values ('inventory'), ('ias16'), ('ias19'), ('ifrs16')) as c (course_id)
where s.status in ('active', 'trialing')
  and (s.current_period_end is null or s.current_period_end > now())
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Only an admin (or the service role / SQL editor) changes an approval.
-- Security invoker, like protect_profile_role: current_user must be the caller.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_approval()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.approval_status is distinct from old.approval_status
      or new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by)
     and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only an admin can approve an account';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_approval
  before update on public.profiles
  for each row execute function public.protect_profile_approval();

-- A new profile can't be created already approved by its owner (rows are created by handle_new_user).
create or replace function public.protect_profile_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' and not public.is_admin() then
    new.approval_status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.role := 'user';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_insert
  before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- Admins edit any profile (approve, reject); owners still edit their own.
create policy "Admins update every profile"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- The caller's access, in one call: for the proxy, the pages and the menus.
-- ---------------------------------------------------------------------------
create or replace function public.access_state()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then jsonb_build_object('admin', false, 'status', 'anonymous', 'courses', '[]'::jsonb)
    else jsonb_build_object(
      'admin', coalesce((select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())), false),
      'status', coalesce((select p.approval_status from public.profiles p where p.id = (select auth.uid())), 'pending'),
      'courses', coalesce((select jsonb_agg(g.course_id order by g.course_id) from public.course_grants g where g.user_id = (select auth.uid())), '[]'::jsonb)
    )
  end;
$$;

grant execute on function public.access_state() to authenticated, anon;

-- True when the caller is an admin, or an approved account granted this course.
create or replace function public.can_open_course(p_course text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p
    join public.course_grants g on g.user_id = p.id and g.course_id = p_course
    where p.id = (select auth.uid()) and p.approval_status = 'approved'
  );
$$;

grant execute on function public.can_open_course(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: every account with its email, status and courses
-- ---------------------------------------------------------------------------
create or replace function public.admin_users()
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
    select jsonb_agg(x order by (x ->> 'status') = 'pending' desc, x ->> 'createdAt' desc) from (
      select jsonb_build_object(
        'userId', u.id,
        'email', coalesce(u.email, ''),
        'fullName', coalesce(p.full_name, ''),
        'role', coalesce(p.role, 'user'),
        'status', coalesce(p.approval_status, 'pending'),
        'createdAt', u.created_at,
        'reviewedAt', p.reviewed_at,
        'courses', coalesce((select jsonb_agg(g.course_id order by g.course_id) from public.course_grants g where g.user_id = u.id), '[]'::jsonb)
      ) as x
      from auth.users u
      left join public.profiles p on p.id = u.id
      limit 2000
    ) t
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.admin_users() to authenticated;

-- Approve, reject or return an account to pending, and set its courses — in one transaction.
create or replace function public.admin_set_access(p_user uuid, p_status text, p_courses text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Unknown status %', p_status;
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'An admin cannot change their own access';
  end if;
  update public.profiles
     set approval_status = p_status, reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = p_user;
  if not found then
    raise exception 'No such account';
  end if;
  delete from public.course_grants
   where user_id = p_user and (p_status <> 'approved' or not (course_id = any (coalesce(p_courses, '{}'))));
  if p_status = 'approved' then
    insert into public.course_grants (user_id, course_id, granted_by)
    select p_user, c, (select auth.uid()) from unnest(coalesce(p_courses, '{}')) as c
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.admin_set_access(uuid, text, text[]) to authenticated;
