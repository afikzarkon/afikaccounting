-- ---------------------------------------------------------------------------
-- admin_analytics, revised: who visited, not only how much happened.
--
-- Three ids sit on an event, and they count different things:
--   session_id  one browser TAB (sessionStorage): a new tab is a new session.
--   meta.v      one BROWSER (localStorage, since 2026-11-08): the same browser on
--               another day is the same visitor; another device or a private
--               window is another.
--   user_id     one ACCOUNT, on events recorded while signed in.
-- A "person" here is the account when one is known, for the event itself or for its
-- browser (a browser that was ever signed in belongs to that account), else the
-- browser, else the tab. It is the closest the data gets to counting people.
--
-- New: totals.entries / visitors / people / accounts, the same per day, and
-- `visits`: where entries came from, which page they landed on, the device, new vs
-- returning visitors, the hour and weekday, pages per visit and one-page visits.
-- ---------------------------------------------------------------------------
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

  with owners as (
    -- A browser that was ever signed in belongs to that account (the first one, if several).
    select meta ->> 'v' as b, (array_agg(user_id order by created_at))[1] as user_id
    from public.analytics_events
    where user_id is not null and meta ? 'v'
    group by 1
  ),
  e as (
    select a.*,
           coalesce(a.meta ->> 'v', a.session_id) as browser,
           coalesce(a.user_id::text, o.user_id::text, a.meta ->> 'v', a.session_id) as person
    from public.analytics_events a
    left join owners o on o.b = a.meta ->> 'v'
    where a.created_at >= since
  ),
  entries as (select * from e where kind = 'landing_view'),
  -- Each tab's visit: its entry and how many pages it went on to view.
  visits as (
    select s.session_id, count(*) filter (where s.kind = 'page_view') as pages
    from e s
    where s.session_id in (select session_id from entries)
    group by s.session_id
  ),
  -- Every browser's first day ever, to tell new visitors from returning ones.
  firsts as (
    select coalesce(meta ->> 'v', session_id) as browser, min(created_at) as first
    from public.analytics_events
    group by 1
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'events', count(*),
        'sessions', count(distinct session_id),
        'entries', count(*) filter (where kind = 'landing_view'),
        'visitors', count(distinct browser),
        'people', count(distinct person),
        'accounts', count(distinct user_id),
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
               count(distinct session_id) as sessions,
               count(*) filter (where kind = 'landing_view') as entries,
               count(distinct browser) as visitors,
               count(distinct person) as people
        from e group by 1
      ) d
    ), '[]'::jsonb),
    'visits', jsonb_build_object(
      'sources', coalesce((
        select jsonb_agg(s order by s.entries desc) from (
          select case
                   when meta ? 'ref' then 'ref:' || (meta ->> 'ref')
                   when meta ? 'utm_source' then meta ->> 'utm_source'
                   when meta ? 'referrer' then 'site:' || (meta ->> 'referrer')
                   else 'direct'
                 end as source,
                 count(*) as entries,
                 count(distinct browser) as visitors
          from entries group by 1 order by 2 desc limit 15
        ) s
      ), '[]'::jsonb),
      'landings', coalesce((
        select jsonb_agg(l order by l.entries desc) from (
          select path, count(*) as entries, count(distinct browser) as visitors
          from entries group by 1 order by 2 desc limit 12
        ) l
      ), '[]'::jsonb),
      'devices', coalesce((
        select jsonb_agg(x order by x.entries desc) from (
          select coalesce(meta ->> 'device', 'unknown') as device, count(*) as entries, count(distinct browser) as visitors
          from entries group by 1
        ) x
      ), '[]'::jsonb),
      'newVisitors', (select count(distinct en.browser) from entries en join firsts f on f.browser = en.browser where f.first >= since),
      'returningVisitors', (select count(distinct en.browser) from entries en join firsts f on f.browser = en.browser where f.first < since),
      'signedInEntries', (select count(*) from entries en where en.user_id is not null or exists (select 1 from owners o where o.b = en.meta ->> 'v')),
      'pagesPerVisit', (select round(avg(pages)::numeric, 1) from visits),
      'onePageVisits', (select count(*) from visits where pages <= 1),
      'visitsCounted', (select count(*) from visits),
      'byHour', coalesce((
        select jsonb_agg(h order by h.hour) from (
          select extract(hour from created_at at time zone 'Asia/Jerusalem')::int as hour, count(*) as entries
          from entries group by 1
        ) h
      ), '[]'::jsonb),
      'byWeekday', coalesce((
        select jsonb_agg(w order by w.dow) from (
          select extract(dow from created_at at time zone 'Asia/Jerusalem')::int as dow, count(*) as entries
          from entries group by 1
        ) w
      ), '[]'::jsonb)
    ),
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
        select path, count(*) as count, count(distinct person) as people from e where kind = 'page_view' group by 1 order by 2 desc limit 12
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
