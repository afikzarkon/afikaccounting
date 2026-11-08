-- AfikAccounting — habit events: the first study action of a day (with the streak), and an exam date set for a course.

alter table public.analytics_events drop constraint analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check (kind in (
  'page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load',
  'landing_view', 'lesson_start', 'signup', 'course_complete', 'paywall_view', 'pricing_view', 'plan_click',
  'checkout_start', 'payment_success', 'subscription_cancel',
  'exercise_answer', 'review_session', 'share_click', 'check_start', 'check_complete',
  'study_day', 'exam_goal_set'
));
