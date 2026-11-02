-- AfikAccounting — what the site shows: the admin hides a course, a lesson, a
-- tool, a menu link, a home-page section, a button or a plan, and may rename a
-- button. Absent row = shown. Apply after 20261105000000_single_session.sql.
--
-- Keys (src/lib/visibility): "link:<href>" for anything with an address (also
-- blocked when opened directly), "home:<section>", "cta:<button>", "plan:<tier>".

create table public.site_visibility (
  key        text primary key check (length(key) between 3 and 300),
  hidden     boolean not null default false,
  -- A button's text in place of its own; null keeps the original.
  label      text check (label is null or length(label) <= 80),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- Everyone reads it (the menus are built from it); only admins write.
alter table public.site_visibility enable row level security;
create policy "Site visibility is public"
  on public.site_visibility for select to anon, authenticated
  using (true);
create policy "Admins manage site visibility"
  on public.site_visibility for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
