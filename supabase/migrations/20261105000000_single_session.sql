-- AfikAccounting — one live session per account, and where accounts sign in from.
-- Apply after 20261104000000_storage_limits.sql.
--
-- Each account has one current session (the JWT's `session_id`). Signing in
-- elsewhere claims the account for the new session; the older one is
-- "replaced": the site signs it out on its next request, and the database
-- stops treating it as a paying reader (has_tier below), so its still-valid
-- access token opens nothing paid either.

-- ---------------------------------------------------------------------------
-- The current session
-- ---------------------------------------------------------------------------
create table public.user_sessions (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  session_id uuid not null,
  claimed_at timestamptz not null default now()
);

-- Written only through claim_session(); a reader may see their own row.
alter table public.user_sessions enable row level security;
create policy "Users read their own session"
  on public.user_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.current_session_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

-- 'current': this session holds the account. 'replaced': another, newer one
-- does. 'unclaimed': nothing recorded yet (signed in before this migration).
create or replace function public.session_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null or public.current_session_id() is null then 'unclaimed'
    when not exists (select 1 from public.user_sessions where user_id = (select auth.uid())) then 'unclaimed'
    when exists (
      select 1 from public.user_sessions
      where user_id = (select auth.uid()) and session_id = public.current_session_id()
    ) then 'current'
    else 'replaced'
  end;
$$;

grant execute on function public.session_status() to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-ins: device and country, for spotting a shared or resold account
-- ---------------------------------------------------------------------------
create table public.sign_ins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  -- A random id the browser keeps in a cookie, and a readable label ("Chrome · Windows").
  device_id  text not null default '',
  device     text not null default '',
  country    text not null default '',
  created_at timestamptz not null default now()
);

create index sign_ins_user_created on public.sign_ins (user_id, created_at desc);

alter table public.sign_ins enable row level security;
create policy "Admins read sign-ins"
  on public.sign_ins for select to authenticated
  using (public.is_admin());

-- Claim the account for the caller's session and record the sign-in. A
-- session may only take the account from an older one: a replaced session,
-- whose access token is still valid for a while, can't claim it back.
create or replace function public.claim_session(p_device_id text default '', p_device text default '', p_country text default '')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  sid uuid := public.current_session_id();
  held uuid;
  mine timestamptz;
  theirs timestamptz;
begin
  if uid is null or sid is null then
    raise exception 'Not signed in';
  end if;

  select session_id into held from public.user_sessions where user_id = uid;
  if held = sid then
    return 'current';
  end if;
  if held is not null then
    select created_at into mine from auth.sessions where id = sid;
    select created_at into theirs from auth.sessions where id = held;
    -- The held session still exists and is newer: this one was replaced.
    if theirs is not null and (mine is null or mine < theirs) then
      return 'replaced';
    end if;
  end if;

  insert into public.user_sessions (user_id, session_id) values (uid, sid)
  on conflict (user_id) do update set session_id = excluded.session_id, claimed_at = now();

  insert into public.sign_ins (user_id, session_id, device_id, device, country)
  values (uid, sid, left(coalesce(p_device_id, ''), 64), left(coalesce(p_device, ''), 120), upper(left(coalesce(p_country, ''), 2)));

  return 'current';
end;
$$;

grant execute on function public.claim_session(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- A replaced session is no longer a paying reader
-- ---------------------------------------------------------------------------
create or replace function public.has_tier(need text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.session_status() <> 'replaced' and exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
      and (s.tier = need or (s.tier = 'exams' and need = 'courses'))
  );
$$;

-- ---------------------------------------------------------------------------
-- For the admin: accounts used from many devices or countries
-- ---------------------------------------------------------------------------
-- A phone and a laptop are two devices; three or more within the window, or
-- two countries, is worth a look.
create or replace function public.admin_device_alerts(p_days int default 30)
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
    select jsonb_agg(a order by a.devices desc, a."lastAt" desc) from (
      select s.user_id as "userId", u.email, coalesce(p.full_name, '') as "fullName",
             count(distinct nullif(s.device_id, '')) as devices,
             count(distinct nullif(s.country, '')) as countries,
             count(*) as "signIns",
             max(s.created_at) as "lastAt",
             jsonb_agg(distinct s.device) filter (where s.device <> '') as labels,
             jsonb_agg(distinct s.country) filter (where s.country <> '') as "countryList"
      from public.sign_ins s
      join auth.users u on u.id = s.user_id
      left join public.profiles p on p.id = s.user_id
      where s.created_at > now() - make_interval(days => greatest(1, least(p_days, 365)))
      group by s.user_id, u.email, p.full_name
      having count(distinct nullif(s.device_id, '')) >= 3 or count(distinct nullif(s.country, '')) >= 2
      order by count(distinct nullif(s.device_id, '')) desc, max(s.created_at) desc
      limit 100
    ) a
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.admin_device_alerts(int) to authenticated;
