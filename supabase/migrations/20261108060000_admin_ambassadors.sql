-- ---------------------------------------------------------------------------
-- admin_ambassadors: what each personal ?ref= link brought in.
--
-- A browser belongs to the first ref link it ever came through, for good, so a
-- student who enters through a link and pays two months later still counts for
-- that ambassador, even if they return directly or through a second link. The
-- window picks who entered through a link in it; what they did is followed from
-- that entry until the end of the window, and nothing before the entry counts.
--
-- admin_funnel's sources can't answer this: it attributes by the first entry in
-- its window, and returns only the top twenty sources of any kind.
-- Aggregates per code only, admins only.
-- ---------------------------------------------------------------------------
create or replace function public.admin_ambassadors(since timestamptz, until timestamptz default now())
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

  with ev as (
    select e.kind, e.meta, e.created_at,
           coalesce(e.meta ->> 'v', e.user_id::text, e.session_id) as v
    from public.analytics_events e
    where e.kind in ('landing_view', 'exercise_answer', 'signup', 'payment_success')
      and e.created_at < until
  ),
  first_ref as (
    select distinct on (v) v, meta ->> 'ref' as code, created_at as entered_at
    from ev
    where kind = 'landing_view' and nullif(btrim(meta ->> 'ref'), '') is not null
    order by v, created_at
  ),
  per as (
    select c.code, c.v,
           count(*) filter (where e.kind = 'exercise_answer') as answers,
           count(*) filter (where e.kind = 'exercise_answer' and e.meta ->> 'trap' = 'true') as traps,
           coalesce(bool_or(e.kind = 'signup'), false) as signup,
           coalesce(bool_or(e.kind = 'payment_success'), false) as paid
    from first_ref c
    left join ev e on e.v = c.v and e.created_at >= c.entered_at and e.kind <> 'landing_view'
    where c.entered_at >= since
    group by c.code, c.v
  )
  select coalesce(jsonb_agg(a order by a.entered desc, a.code), '[]'::jsonb) into result
  from (
    -- Anyone can type any code into an address, so a stray flood of them stays bounded.
    select code,
           count(*) as entered,
           count(*) filter (where answers > 0) as answered,
           count(*) filter (where answers >= 5 and traps >= 1) as activated,
           count(*) filter (where signup) as "signedUp",
           count(*) filter (where paid) as paid
    from per
    group by code
    order by 2 desc, code
    limit 200
  ) a;
  return result;
end;
$$;

revoke execute on function public.admin_ambassadors(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_ambassadors(timestamptz, timestamptz) to authenticated;
