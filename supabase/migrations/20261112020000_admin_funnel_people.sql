-- ---------------------------------------------------------------------------
-- admin_funnel, revised for the closed site and for people rather than browsers.
--
-- A person is the account when one is known (on the event, or for its browser: a
-- browser that was ever signed in belongs to that account), else the browser, else
-- the tab, as in admin_analytics. Before, one student on a laptop and a phone was
-- two "visitors", and a signed-in student's events were split from their browsing.
--
-- The site is closed: an account signs up, waits for an admin's approval, and only
-- then studies. So the funnel now reads: entered -> has an account -> approved ->
-- opened a lesson -> answered -> activated -> back on another day; the payment steps
-- stay (zero while pricing is hidden). Also: accounts waiting for approval now, and
-- accounts created in the window.
-- ---------------------------------------------------------------------------
create or replace function public.admin_funnel(since timestamptz, until timestamptz default now(), p_source text default null)
returns jsonb
language plpgsql
stable
security definer
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
  allev as (
    select e.*, coalesce(e.user_id::text, o.user_id::text, e.meta ->> 'v', e.session_id) as v
    from public.analytics_events e
    left join owners o on o.b = e.meta ->> 'v'
  ),
  ev as (
    select e.kind, e.target, e.path, e.ok, e.meta, e.created_at, e.v,
           (e.created_at at time zone 'Asia/Jerusalem')::date as d
    from allev e
    where e.created_at >= since and e.created_at < until
  ),
  -- Each visitor's first entry in the window, and where it came from.
  entries as (
    select distinct on (v) v, meta from ev where kind = 'landing_view' order by v, created_at
  ),
  src as (
    select v,
           case
             when meta ? 'ref' then 'ref:' || (meta ->> 'ref')
             when meta ? 'utm_source' then meta ->> 'utm_source'
             when meta ? 'referrer' then 'site:' || (meta ->> 'referrer')
             else 'direct'
           end as source
    from entries
  ),
  cohort as (select v, source from src where p_source is null or source = p_source),
  per as (
    select c.v, c.source,
           count(*) filter (where e.kind = 'exercise_answer') as answers,
           count(*) filter (where e.kind = 'exercise_answer' and e.meta ->> 'trap' = 'true') as traps,
           coalesce(bool_or(e.kind = 'signup'), false) as signup,
           coalesce(bool_or(e.kind = 'lesson_start'), false) as lesson,
           count(distinct e.d) as days,
           coalesce(bool_or(e.kind = 'paywall_view'), false) as paywall,
           coalesce(bool_or(e.kind = 'plan_click'), false) as plan,
           coalesce(bool_or(e.kind = 'checkout_start'), false) as checkout,
           coalesce(bool_or(e.kind = 'payment_success'), false) as paid
    from cohort c left join ev e on e.v = c.v
    group by c.v, c.source
  ),
  -- The person's account, when the id is one, and its approval now.
  acct as (
    select per.*, p.id is not null as has_account, coalesce(p.approval_status = 'approved' or p.role = 'admin', false) as approved
    from per
    left join public.profiles p on p.id::text = per.v
  ),
  -- Every visitor's days of activity up to the end of the window, for "new" and for retention.
  vd as (
    select distinct e.v, (e.created_at at time zone 'Asia/Jerusalem')::date as d
    from allev e
    where e.created_at < until
  ),
  firsts as (select v, min(d) as first from vd group by v)
  select jsonb_build_object(
    'funnel', (
      select jsonb_build_object(
        'entered', count(*),
        'accounts', count(*) filter (where has_account),
        'approved', count(*) filter (where approved),
        'lessonStarted', count(*) filter (where lesson),
        'answered', count(*) filter (where answers > 0),
        'activated', count(*) filter (where answers >= 5 and traps >= 1),
        'signedUp', count(*) filter (where signup),
        'returned', count(*) filter (where days >= 2),
        'paywall', count(*) filter (where paywall),
        'plan', count(*) filter (where plan),
        'checkout', count(*) filter (where checkout),
        'paid', count(*) filter (where paid)
      ) from acct
    ),
    'pendingApproval', (select count(*) from public.profiles where approval_status = 'pending' and role <> 'admin'),
    'newAccounts', (select count(*) from auth.users where created_at >= since and created_at < until),
    'newVisitors', (select count(*) from firsts where first >= (since at time zone 'Asia/Jerusalem')::date),
    'sources', coalesce((
      select jsonb_agg(s order by s.visitors desc) from (
        select source, count(*) as visitors,
               count(*) filter (where answers > 0) as answered,
               count(*) filter (where answers >= 5 and traps >= 1) as activated,
               count(*) filter (where signup) as "signedUp",
               count(*) filter (where has_account) as accounts,
               count(*) filter (where paid) as paid
        from acct group by source order by 2 desc limit 20
      ) s
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(x order by x.day) from (
        select d as day,
               count(distinct v) filter (where kind = 'landing_view') as entries,
               count(distinct v) filter (where kind = 'exercise_answer') as learners,
               count(*) filter (where kind = 'signup') as signups,
               count(*) filter (where kind = 'payment_success') as payments
        from ev group by d
      ) x
    ), '[]'::jsonb),
    -- Weekly learners who answered at least 10 questions that week: the north star.
    'weekly', coalesce((
      select jsonb_agg(w order by w.week) from (
        select week, count(*) as learners from (
          select v, date_trunc('week', d)::date as week from ev where kind = 'exercise_answer' group by v, week having count(*) >= 10
        ) q group by week
      ) w
    ), '[]'::jsonb),
    -- Cohorts by the week of a visitor's first day: back the next day, in the second week, in the second month.
    'retention', coalesce((
      select jsonb_agg(r order by r.week) from (
        select date_trunc('week', f.first)::date as week,
               count(*) as size,
               count(*) filter (where exists (select 1 from vd where vd.v = f.v and vd.d = f.first + 1)) as d1,
               count(*) filter (where exists (select 1 from vd where vd.v = f.v and vd.d between f.first + 7 and f.first + 13)) as d7,
               count(*) filter (where exists (select 1 from vd where vd.v = f.v and vd.d between f.first + 30 and f.first + 59)) as d30
        from firsts f
        where f.first >= (since at time zone 'Asia/Jerusalem')::date
        group by 1
      ) r
    ), '[]'::jsonb),
    'habits', (
      select jsonb_build_object(
        'reviewSessions', count(*) filter (where kind = 'review_session'),
        'reviewers', count(distinct v) filter (where kind = 'review_session'),
        'studiers', count(distinct v) filter (where kind = 'study_day'),
        'examGoals', count(distinct v) filter (where kind = 'exam_goal_set'),
        'emailVisits', (select count(*) from entries where meta ->> 'utm_source' = 'email'),
        'groups', (select count(*) from public.study_groups),
        'groupMembers', (select count(*) from public.study_group_members),
        'remindersOn', (select count(*) from public.study_habits where reminders)
      ) from ev
    ),
    'streaks', (
      select jsonb_build_object(
        's1', count(*) filter (where m = 1),
        's2', count(*) filter (where m between 2 and 3),
        's4', count(*) filter (where m between 4 and 7),
        's8', count(*) filter (where m >= 8)
      ) from (
        select v, max(case when meta ->> 'streak' ~ '^[0-9]{1,4}$' then (meta ->> 'streak')::int end) as m
        from ev where kind = 'study_day' group by v
      ) q
    ),
    'shares', (
      select jsonb_build_object(
        'clicks', count(*) filter (where kind = 'share_click'),
        'byKind', coalesce((select jsonb_object_agg(k, n) from (select meta ->> 'kind' as k, count(*) as n from ev where kind = 'share_click' and meta ? 'kind' group by 1) q), '{}'::jsonb),
        'visits', (select count(*) from entries where meta ->> 'utm_source' = 'share'),
        'visitsSignedUp', (select count(*) from per p join src s on s.v = p.v where s.source = 'share' and p.signup)
      ) from ev
    ),
    'checks', (
      select jsonb_build_object(
        'started', count(distinct v) filter (where kind = 'check_start'),
        'completed', count(distinct v) filter (where kind = 'check_complete'),
        'avgRight', round(avg(case when kind = 'check_complete' and meta ->> 'right' ~ '^[0-9]{1,2}$' then (meta ->> 'right')::numeric end), 2),
        'byCourse', coalesce((
          select jsonb_agg(c) from (
            select target as course, count(distinct v) filter (where kind = 'check_start') as started, count(distinct v) filter (where kind = 'check_complete') as completed
            from ev where kind in ('check_start', 'check_complete') and target is not null and coalesce(meta ->> 'mode', '') <> 'exam' group by 1
          ) c
        ), '[]'::jsonb)
      ) from ev where coalesce(meta ->> 'mode', '') <> 'exam'
    ),
    'exams', (
      select jsonb_build_object(
        'started', count(*) filter (where kind = 'check_start'),
        'completed', count(*) filter (where kind = 'check_complete'),
        'timed', count(*) filter (where kind = 'check_start' and meta ->> 'timed' = 'true'),
        'avgShare', round(avg(case when kind = 'check_complete' and meta ->> 'right' ~ '^[0-9]{1,3}$' and meta ->> 'of' ~ '^[1-9][0-9]{0,2}$'
                                   then (meta ->> 'right')::numeric / (meta ->> 'of')::numeric end), 3),
        'byCourse', coalesce((
          select jsonb_agg(c) from (
            select regexp_replace(target, '^exam-', '') as course, count(*) filter (where kind = 'check_start') as started, count(*) filter (where kind = 'check_complete') as completed
            from ev where kind in ('check_start', 'check_complete') and meta ->> 'mode' = 'exam' and target is not null group by 1
          ) c
        ), '[]'::jsonb)
      ) from ev where meta ->> 'mode' = 'exam'
    ),
    'lessons', coalesce((
      select jsonb_agg(l order by l.starts desc, l.answers desc) from (
        select target as slug,
               count(distinct v) filter (where kind = 'lesson_start') as starts,
               count(distinct v) filter (where kind = 'exercise_answer') as learners,
               count(*) filter (where kind = 'exercise_answer') as answers,
               count(*) filter (where kind = 'exercise_answer' and coalesce(meta ->> 'try', '1') = '1') as "firstTries",
               count(*) filter (where kind = 'exercise_answer' and coalesce(meta ->> 'try', '1') = '1' and ok) as "firstTryRight",
               count(*) filter (where kind = 'exercise_answer' and meta ->> 'trap' = 'true') as traps,
               count(*) filter (where kind = 'exercise_answer' and meta ->> 'trap' = 'true' and ok = false) as "trapFalls"
        from ev
        where kind in ('lesson_start', 'exercise_answer') and target is not null and target <> 'home-hero'
        group by 1 order by 2 desc, 4 desc limit 80
      ) l
    ), '[]'::jsonb),
    'traps', coalesce((
      select jsonb_agg(t) from (
        select target as slug, meta ->> 'id' as id, count(*) as answers, count(*) filter (where ok = false) as falls
        from ev
        where kind = 'exercise_answer' and meta ->> 'trap' = 'true' and meta ? 'id'
        group by 1, 2 having count(*) >= 3
        order by (count(*) filter (where ok = false))::numeric / count(*) desc, 4 desc limit 12
      ) t
    ), '[]'::jsonb),
    'paywalls', coalesce((
      select jsonb_agg(p order by p.views desc) from (
        select g.target as gate, count(distinct g.v) as views,
               count(distinct g.v) filter (where exists (select 1 from ev c where c.v = g.v and c.kind = 'plan_click' and c.created_at >= g.created_at)) as clicks
        from ev g where g.kind = 'paywall_view' and g.target is not null group by 1 order by 2 desc limit 20
      ) p
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke execute on function public.admin_funnel(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_funnel(timestamptz, timestamptz, text) to authenticated;
