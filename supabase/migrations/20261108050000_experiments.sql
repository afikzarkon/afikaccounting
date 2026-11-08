-- ---------------------------------------------------------------------------
-- A/B experiments: the exposure event, and each variant's funnel.
--
-- experiment_view: a visitor saw an experiment's page (meta.exp, meta.variant;
-- see lib/experiments.ts). admin_experiment() follows every exposed browser
-- from its first exposure in the window: did they answer, activate (5 answers,
-- one a trap), sign up, pay. Aggregates only, admins only.
-- ---------------------------------------------------------------------------
alter table public.analytics_events drop constraint analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check (kind in (
  'page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load',
  'landing_view', 'lesson_start', 'signup', 'course_complete', 'paywall_view', 'pricing_view', 'plan_click',
  'checkout_start', 'payment_success', 'subscription_cancel',
  'exercise_answer', 'review_session', 'share_click', 'check_start', 'check_complete',
  'study_day', 'exam_goal_set', 'experiment_view'
));

create or replace function public.admin_experiment(p_exp text, since timestamptz, until timestamptz default now())
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

  with ev as (
    select e.kind, e.ok, e.meta, e.created_at, coalesce(e.meta ->> 'v', e.user_id::text, e.session_id) as v
    from public.analytics_events e
    where e.created_at >= since and e.created_at < until
  ),
  -- Each browser's first exposure in the window, and its variant then (a visitor keeps one variant).
  exposed as (
    select distinct on (v) v, meta ->> 'variant' as variant, created_at as at
    from ev where kind = 'experiment_view' and meta ->> 'exp' = p_exp
    order by v, created_at
  ),
  per as (
    select x.variant, x.v,
           count(*) filter (where e.kind = 'exercise_answer' and e.created_at >= x.at) as answers,
           count(*) filter (where e.kind = 'exercise_answer' and e.created_at >= x.at and e.meta ->> 'trap' = 'true') as traps,
           coalesce(bool_or(e.kind = 'signup' and e.created_at >= x.at), false) as signup,
           coalesce(bool_or(e.kind = 'payment_success' and e.created_at >= x.at), false) as paid
    from exposed x left join ev e on e.v = x.v
    group by x.variant, x.v
  )
  select coalesce(jsonb_agg(r order by r.variant), '[]'::jsonb) into result from (
    select variant, count(*) as visitors,
           count(*) filter (where answers > 0) as answered,
           count(*) filter (where answers >= 5 and traps >= 1) as activated,
           count(*) filter (where signup) as "signedUp",
           count(*) filter (where paid) as paid
    from per group by variant
  ) r;
  return result;
end;
$$;

revoke execute on function public.admin_experiment(text, timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_experiment(text, timestamptz, timestamptz) to authenticated;
