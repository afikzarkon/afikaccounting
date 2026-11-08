-- AfikAccounting — learning events: each practice answer, a review session, a share, and the summary self-check.
-- They let the funnel measure activation (answers, traps, a day-2 review) and the share loop.

alter table public.analytics_events drop constraint analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check (kind in (
  'page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load',
  'landing_view', 'lesson_start', 'signup', 'course_complete', 'paywall_view', 'pricing_view', 'plan_click',
  'checkout_start', 'payment_success', 'subscription_cancel',
  'exercise_answer', 'review_session', 'share_click', 'check_start', 'check_complete'
));
