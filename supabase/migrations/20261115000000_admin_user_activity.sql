-- ---------------------------------------------------------------------------
-- Admin: how much each account uses the site.
--
-- Per account: sign-ins (public.sign_ins, one row per login), visits (distinct
-- per-tab session ids in analytics_events while signed in: a new tab or a new
-- day is a new visit), active days (distinct Israel-time dates with any event)
-- and when it was last seen (its latest event or sign-in). Accounts with no
-- activity are left out; the page shows them as zero.
--
-- Its own function, so /admin/users still works before this runs.
-- ---------------------------------------------------------------------------
create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

create or replace function public.admin_user_activity()
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
    select jsonb_agg(jsonb_build_object(
      'userId', a.user_id,
      'signIns', coalesce(s.sign_ins, 0),
      'visits', coalesce(e.visits, 0),
      'activeDays', coalesce(e.active_days, 0),
      'lastSeen', greatest(e.last_event, s.last_sign_in)
    ))
    from (
      select user_id from public.sign_ins
      union
      select user_id from public.analytics_events where user_id is not null
    ) a
    left join (
      select user_id, count(*) as sign_ins, max(created_at) as last_sign_in
      from public.sign_ins group by user_id
    ) s on s.user_id = a.user_id
    left join (
      select user_id,
             count(distinct session_id) as visits,
             count(distinct (created_at at time zone 'Asia/Jerusalem')::date) as active_days,
             max(created_at) as last_event
      from public.analytics_events where user_id is not null group by user_id
    ) e on e.user_id = a.user_id
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.admin_user_activity() to authenticated;
