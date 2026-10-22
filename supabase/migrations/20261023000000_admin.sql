-- AfikAccounting — admin portal: roles, media library, scenario presets, usage analytics.
-- Apply after 20261022000000_init.sql.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

-- True when the signed-in user is an admin. Security definer so policies on
-- other tables can call it without granting read access to every profile.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

-- Users may edit their own profile, but never their own role. Only an existing
-- admin, the service role, or the SQL editor (postgres) can change a role.
-- Security invoker on purpose: current_user must be the caller's role, not the
-- function owner's (as security definer, every caller would look like postgres).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create policy "Admins read every profile"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Content: admins see drafts and manage everything
-- ---------------------------------------------------------------------------
create policy "Admins read all content"
  on public.content for select to authenticated
  using (public.is_admin());
create policy "Admins create content"
  on public.content for insert to authenticated
  with check (public.is_admin());
create policy "Admins update content"
  on public.content for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Admins delete content"
  on public.content for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Media library: files in the "media" storage bucket, and embedded videos
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('excel', 'pdf', 'video', 'image', 'other')),
  -- upload: a file in the "media" bucket; youtube / vimeo: an embedded video.
  source       text not null check (source in ('upload', 'youtube', 'vimeo')),
  title        text not null check (char_length(title) between 1 and 200),
  description  text not null default '' check (char_length(description) <= 2000),
  url          text not null,
  storage_path text,
  mime_type    text,
  size_bytes   bigint not null default 0 check (size_bytes >= 0),
  category     text not null default '' check (char_length(category) <= 80),
  -- The part of the site it belongs to, e.g. a calculator slug or "content".
  module       text not null default '' check (char_length(module) <= 80),
  tags         text[] not null default '{}',
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((source = 'upload') = (storage_path is not null))
);

create index media_assets_kind_idx on public.media_assets (kind, created_at desc);

create trigger media_assets_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;

create policy "Media is public"
  on public.media_assets for select to anon, authenticated
  using (true);
create policy "Admins manage media"
  on public.media_assets for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Admins upload media files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "Admins update media files"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "Admins delete media files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Scenario presets: ready-made inputs users load into a calculator
-- ---------------------------------------------------------------------------
create table public.scenario_presets (
  id              uuid primary key default gen_random_uuid(),
  calculator_slug text not null,
  title           text not null check (char_length(title) between 1 and 120),
  description     text not null default '' check (char_length(description) <= 600),
  inputs          jsonb not null check (jsonb_typeof(inputs) = 'object'),
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index scenario_presets_calc_idx on public.scenario_presets (calculator_slug, sort_order);

create trigger scenario_presets_updated_at
  before update on public.scenario_presets
  for each row execute function public.set_updated_at();

alter table public.scenario_presets enable row level security;

create policy "Published presets are public"
  on public.scenario_presets for select to anon, authenticated
  using (is_published);
create policy "Admins manage presets"
  on public.scenario_presets for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Usage analytics: anonymous events, written by anyone, read by admins only
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load')),
  -- A random per-tab id, for counting sessions; never linked to an account.
  session_id  text not null check (char_length(session_id) between 8 and 64),
  user_id     uuid references auth.users (id) on delete set null,
  path        text not null default '' check (char_length(path) <= 300),
  calculator  text check (char_length(calculator) <= 80),
  mode        text check (mode in ('regular', 'solve')),
  ok          boolean,
  duration_ms integer check (duration_ms between 0 and 600000),
  preset_id   uuid,
  target      text check (char_length(target) <= 500),
  label       text check (char_length(label) <= 200),
  source      text check (source in ('upload', 'youtube', 'vimeo', 'demo', 'external')),
  meta        jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object' and pg_column_size(meta) <= 2000),
  created_at  timestamptz not null default now()
);

create index analytics_events_time_idx on public.analytics_events (created_at desc);
create index analytics_events_kind_idx on public.analytics_events (kind, created_at desc);

alter table public.analytics_events enable row level security;

create policy "Anyone records events"
  on public.analytics_events for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "Admins read events"
  on public.analytics_events for select to authenticated
  using (public.is_admin());
create policy "Admins delete events"
  on public.analytics_events for delete to authenticated
  using (public.is_admin());

-- Every dashboard figure for one time window, aggregated in the database (the
-- API returns at most 1,000 rows, so raw events are never summed in the app).
create or replace function public.admin_analytics(since timestamptz)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  with e as (select * from public.analytics_events where created_at >= since)
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'events', count(*),
        'sessions', count(distinct session_id),
        'pageViews', count(*) filter (where kind = 'page_view'),
        'calcRuns', count(*) filter (where kind = 'calc_run'),
        'downloads', count(*) filter (where kind = 'download'),
        'videoPlays', count(*) filter (where kind = 'video_play'),
        'presetLoads', count(*) filter (where kind = 'preset_load')
      ) from e
    ),
    'daily', coalesce((
      select jsonb_agg(d order by d.day) from (
        select (created_at at time zone 'Asia/Jerusalem')::date as day,
               count(*) filter (where kind = 'page_view') as "pageViews",
               count(*) filter (where kind = 'calc_run' and mode = 'regular') as "calcRegular",
               count(*) filter (where kind = 'calc_run' and mode = 'solve') as "calcSolve",
               count(*) filter (where kind = 'download') as downloads,
               count(*) filter (where kind = 'video_play') as "videoPlays",
               count(distinct session_id) as sessions
        from e group by 1
      ) d
    ), '[]'::jsonb),
    'calculators', coalesce((
      select jsonb_agg(c order by c.runs desc) from (
        select calculator as slug,
               count(*) filter (where kind = 'calc_run') as runs,
               count(*) filter (where kind = 'calc_run' and mode = 'regular') as regular,
               count(*) filter (where kind = 'calc_run' and mode = 'solve') as solve,
               count(*) filter (where kind = 'calc_run' and ok) as ok,
               count(*) filter (where kind = 'calc_run' and not ok) as failed,
               count(*) filter (where kind = 'calc_invalid') as invalid
        from e where calculator is not null and kind in ('calc_run', 'calc_invalid') group by 1
      ) c
    ), '[]'::jsonb),
    'solver', (
      select jsonb_build_object(
        'regularOk', count(*) filter (where kind = 'calc_run' and mode = 'regular' and ok),
        'regularFailed', count(*) filter (where kind = 'calc_run' and mode = 'regular' and not ok),
        'regularInvalid', count(*) filter (where kind = 'calc_invalid' and mode = 'regular'),
        'solveOk', count(*) filter (where kind = 'calc_run' and mode = 'solve' and ok),
        'solveFailed', count(*) filter (where kind = 'calc_run' and mode = 'solve' and not ok),
        'solveInvalid', count(*) filter (where kind = 'calc_invalid' and mode = 'solve')
      ) from e
    ),
    'presets', (
      select jsonb_build_object(
        'loads', count(*) filter (where kind = 'preset_load'),
        'runsFromPreset', count(*) filter (where kind = 'calc_run' and preset_id is not null),
        'runs', count(*) filter (where kind = 'calc_run')
      ) from e
    ),
    'topPresets', coalesce((
      select jsonb_agg(p order by p.count desc) from (
        select preset_id as id, max(label) as title, count(*) as count
        from e where kind = 'preset_load' and preset_id is not null group by 1 order by 3 desc limit 10
      ) p
    ), '[]'::jsonb),
    'downloads', coalesce((
      select jsonb_agg(x order by x.count desc) from (
        select target as url, max(label) as title, max(meta ->> 'fileKind') as kind, count(*) as count
        from e where kind = 'download' and target is not null group by 1 order by 4 desc limit 15
      ) x
    ), '[]'::jsonb),
    'videoSources', coalesce((
      select jsonb_agg(v) from (
        select coalesce(source, 'upload') as source, count(*) as count from e where kind = 'video_play' group by 1
      ) v
    ), '[]'::jsonb),
    'videos', coalesce((
      select jsonb_agg(v order by v.count desc) from (
        select target as slug, max(label) as title, max(source) as source, count(*) as count
        from e where kind = 'video_play' and target is not null group by 1 order by 4 desc limit 10
      ) v
    ), '[]'::jsonb),
    'modules', coalesce((
      select jsonb_agg(m order by m.count desc) from (
        select coalesce(nullif(split_part(path, '/', 2), ''), 'home') as module, count(*) as count, count(distinct session_id) as sessions
        from e where kind = 'page_view' group by 1
      ) m
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(p order by p.count desc) from (
        select path, count(*) as count from e where kind = 'page_view' group by 1 order by 2 desc limit 12
      ) p
    ), '[]'::jsonb),
    'timing', (
      select jsonb_build_object(
        'samples', count(duration_ms),
        'avgMs', round(avg(duration_ms)::numeric, 1),
        'p95Ms', percentile_cont(0.95) within group (order by duration_ms)
      ) from e where kind = 'calc_run' and duration_ms is not null
    )
  ) into result;
  return result;
end;
$$;

grant execute on function public.admin_analytics(timestamptz) to authenticated;

-- Storage used by the media library, per kind (all time, not windowed).
create or replace function public.admin_storage()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return coalesce((
    select jsonb_agg(s order by s.bytes desc) from (
      select kind, source, count(*) as files, coalesce(sum(size_bytes), 0) as bytes
      from public.media_assets group by kind, source
    ) s
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.admin_storage() to authenticated;
