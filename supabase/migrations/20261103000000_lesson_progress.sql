-- ---------------------------------------------------------------------------
-- Lesson progress, per account: one row per user and lesson.
--
-- The browser keeps the reader's progress as it always did; for a signed-in
-- reader it is merged with this table on arrival and written back as it
-- changes, so the same progress follows them to every device. The row holds
-- the lesson's progress as the site stores it (the place in the lesson, the
-- concepts read, every answer, the streak); the server checks its shape before
-- writing it.
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug       text not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  progress   jsonb not null check (jsonb_typeof(progress) = 'object' and pg_column_size(progress) < 32768),
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create trigger lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

create policy "Users read their own progress"
  on public.lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users record their own progress"
  on public.lesson_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own progress"
  on public.lesson_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users clear their own progress"
  on public.lesson_progress for delete to authenticated
  using ((select auth.uid()) = user_id);
