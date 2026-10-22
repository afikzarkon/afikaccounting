-- AfikAccounting — initial schema
-- Users live in auth.users (managed by Supabase Auth); public.profiles extends them.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null default '' check (char_length(full_name) <= 120),
  organization       text not null default '' check (char_length(organization) <= 120),
  job_title          text not null default '' check (char_length(job_title) <= 120),
  preferred_standard text not null default '' check (char_length(preferred_standard) <= 40),
  avatar_url         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are editable by their owner"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create the profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Content library (videos and articles)
-- ---------------------------------------------------------------------------
create table public.content (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind             text not null check (kind in ('video', 'article')),
  title            text not null,
  summary          text not null default '',
  standard         text not null,
  category         text not null,
  level            text not null check (level in ('beginner', 'intermediate', 'advanced')),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  video_url        text,
  -- Article body: [{ "heading": text, "paragraphs": [text] }]
  body             jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array'),
  -- Video chapters: [{ "at": seconds, "title": text }]
  chapters         jsonb not null default '[]'::jsonb check (jsonb_typeof(chapters) = 'array'),
  -- Attachments: [{ "title", "kind", "url", "size" }]
  resources        jsonb not null default '[]'::jsonb check (jsonb_typeof(resources) = 'array'),
  tags             text[] not null default '{}',
  is_published     boolean not null default true,
  published_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index content_published_idx on public.content (is_published, published_at desc);
create index content_standard_idx on public.content (standard);
create index content_category_idx on public.content (category);

create trigger content_updated_at
  before update on public.content
  for each row execute function public.set_updated_at();

alter table public.content enable row level security;

create policy "Published content is public"
  on public.content for select to anon, authenticated
  using (is_published);

-- ---------------------------------------------------------------------------
-- Accounting calculators: the wizard definition is stored as JSON so it can be
-- versioned and inspected; the solver for each slug lives in application code.
-- ---------------------------------------------------------------------------
create table public.accounting_calculators (
  slug        text primary key,
  standard    text not null,
  title       text not null,
  category    text not null,
  schema      jsonb not null check (jsonb_typeof(schema) = 'object'),
  version     integer not null default 1,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger accounting_calculators_updated_at
  before update on public.accounting_calculators
  for each row execute function public.set_updated_at();

alter table public.accounting_calculators enable row level security;

create policy "Active calculators are public"
  on public.accounting_calculators for select to anon, authenticated
  using (is_active);

-- ---------------------------------------------------------------------------
-- Saved solutions
-- ---------------------------------------------------------------------------
create table public.saved_solutions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  calculator_slug text not null,
  title           text not null check (char_length(title) between 1 and 120),
  inputs          jsonb not null check (jsonb_typeof(inputs) = 'object'),
  headline        text not null default '',
  metrics         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index saved_solutions_user_idx on public.saved_solutions (user_id, updated_at desc);

create trigger saved_solutions_updated_at
  before update on public.saved_solutions
  for each row execute function public.set_updated_at();

alter table public.saved_solutions enable row level security;

create policy "Users read their own solutions"
  on public.saved_solutions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their own solutions"
  on public.saved_solutions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own solutions"
  on public.saved_solutions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own solutions"
  on public.saved_solutions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Watch history (one row per user and content item)
-- ---------------------------------------------------------------------------
create table public.watch_history (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id       uuid not null references public.content (id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  completed        boolean not null default false,
  first_viewed_at  timestamptz not null default now(),
  last_viewed_at   timestamptz not null default now(),
  primary key (user_id, content_id)
);

create index watch_history_recent_idx on public.watch_history (user_id, last_viewed_at desc);

alter table public.watch_history enable row level security;

create policy "Users read their own history"
  on public.watch_history for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users record their own history"
  on public.watch_history for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own history"
  on public.watch_history for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users clear their own history"
  on public.watch_history for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Activity log for the dashboard timeline
-- ---------------------------------------------------------------------------
create table public.activity_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('solution_saved', 'solution_deleted', 'content_started', 'content_completed', 'profile_updated', 'account_confirmed')),
  label      text not null default '',
  href       text,
  created_at timestamptz not null default now()
);

create index activity_events_user_idx on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;

create policy "Users read their own activity"
  on public.activity_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users record their own activity"
  on public.activity_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
