-- =====================================================================
-- 光羽小说 — Phase 1: initial schema
-- Tables: profiles, authors, categories, novels, chapters, banners,
--         site_settings, bookmarks, reading_history
-- Roles : superadmin, admin, author, reader
-- RLS   : enabled on every table, with policies described inline
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('superadmin', 'admin', 'author', 'reader');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.novel_status as enum
    ('draft', 'pending_review', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.chapter_status as enum
    ('draft', 'pending_review', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- profiles — one row per auth.users row
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.user_role not null default 'reader',
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Role helper — security definer so RLS policies can read profiles.role
-- without recursing into the profiles RLS.
-- =====================================================================
create or replace function public.current_role_value()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_value() = 'superadmin', false);
$$;

create or replace function public.is_admin_or_higher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_value() in ('superadmin', 'admin'), false);
$$;

-- =====================================================================
-- authors — extra metadata for users with role 'author'
-- =====================================================================
create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references public.profiles(id) on delete cascade,
  pen_name    text not null,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists authors_set_updated_at on public.authors;
create trigger authors_set_updated_at
  before update on public.authors
  for each row execute function public.set_updated_at();

-- =====================================================================
-- categories
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- novels
-- =====================================================================
create table if not exists public.novels (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.authors(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  slug         text not null unique,
  title        text not null,
  description  text,
  cover_url    text,
  status       public.novel_status not null default 'draft',
  featured     boolean not null default false,
  view_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists novels_author_idx    on public.novels(author_id);
create index if not exists novels_category_idx  on public.novels(category_id);
create index if not exists novels_status_idx    on public.novels(status);
create index if not exists novels_featured_idx  on public.novels(featured) where featured = true;

drop trigger if exists novels_set_updated_at on public.novels;
create trigger novels_set_updated_at
  before update on public.novels
  for each row execute function public.set_updated_at();

-- =====================================================================
-- chapters
-- =====================================================================
create table if not exists public.chapters (
  id             uuid primary key default gen_random_uuid(),
  novel_id       uuid not null references public.novels(id) on delete cascade,
  chapter_number integer not null,
  title          text not null,
  content        text not null,
  status         public.chapter_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz,
  unique (novel_id, chapter_number)
);

create index if not exists chapters_novel_idx  on public.chapters(novel_id);
create index if not exists chapters_status_idx on public.chapters(status);

drop trigger if exists chapters_set_updated_at on public.chapters;
create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- =====================================================================
-- banners
-- =====================================================================
create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  image_url    text not null,
  link_url     text,
  button_label text,
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();

-- =====================================================================
-- site_settings — key/value store editable from the admin CMS
-- =====================================================================
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- bookmarks
-- =====================================================================
create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  novel_id   uuid not null references public.novels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, novel_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks(user_id);

-- =====================================================================
-- reading_history
-- =====================================================================
create table if not exists public.reading_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  novel_id     uuid not null references public.novels(id) on delete cascade,
  chapter_id   uuid references public.chapters(id) on delete set null,
  last_read_at timestamptz not null default now(),
  unique (user_id, novel_id)
);

create index if not exists reading_history_user_idx on public.reading_history(user_id);

-- =====================================================================
-- RLS — enable on every table
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.authors         enable row level security;
alter table public.categories      enable row level security;
alter table public.novels          enable row level security;
alter table public.chapters        enable row level security;
alter table public.banners         enable row level security;
alter table public.site_settings   enable row level security;
alter table public.bookmarks       enable row level security;
alter table public.reading_history enable row level security;

-- ---------------------------------------------------------------------
-- profiles policies
--   * each user can read & update their own row
--   * admin/superadmin can read & update any row
--   * role changes restricted to superadmin (enforced via update WITH CHECK)
-- ---------------------------------------------------------------------
drop policy if exists "profiles: self select"    on public.profiles;
drop policy if exists "profiles: admin select"   on public.profiles;
drop policy if exists "profiles: self update"    on public.profiles;
drop policy if exists "profiles: admin update"   on public.profiles;
drop policy if exists "profiles: superadmin all" on public.profiles;

create policy "profiles: self select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin select"
  on public.profiles for select
  using (public.is_admin_or_higher());

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_role_value()); -- can't change own role

create policy "profiles: superadmin all"
  on public.profiles for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ---------------------------------------------------------------------
-- authors policies
--   * anyone may select (pen_name shown on novel detail pages)
--   * an author manages their own row; superadmin manages any
-- ---------------------------------------------------------------------
drop policy if exists "authors: public select"   on public.authors;
drop policy if exists "authors: self manage"     on public.authors;
drop policy if exists "authors: superadmin all"  on public.authors;

create policy "authors: public select"
  on public.authors for select
  using (true);

create policy "authors: self manage"
  on public.authors for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "authors: superadmin all"
  on public.authors for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ---------------------------------------------------------------------
-- categories policies
--   * public read
--   * admin/superadmin write
-- ---------------------------------------------------------------------
drop policy if exists "categories: public select" on public.categories;
drop policy if exists "categories: admin write"   on public.categories;

create policy "categories: public select"
  on public.categories for select
  using (true);

create policy "categories: admin write"
  on public.categories for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- novels policies
--   * anyone (incl. anon) reads published novels
--   * authors read & manage their own novels (any status)
--   * admin/superadmin read & manage all
-- ---------------------------------------------------------------------
drop policy if exists "novels: public read published" on public.novels;
drop policy if exists "novels: author read own"       on public.novels;
drop policy if exists "novels: author write own"      on public.novels;
drop policy if exists "novels: admin all"             on public.novels;

create policy "novels: public read published"
  on public.novels for select
  using (status = 'published');

create policy "novels: author read own"
  on public.novels for select
  using (
    exists (
      select 1 from public.authors a
      where a.id = novels.author_id and a.profile_id = auth.uid()
    )
  );

create policy "novels: author write own"
  on public.novels for all
  using (
    exists (
      select 1 from public.authors a
      where a.id = novels.author_id and a.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.authors a
      where a.id = novels.author_id and a.profile_id = auth.uid()
    )
  );

create policy "novels: admin all"
  on public.novels for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- chapters policies
--   * anyone reads published chapters whose parent novel is published
--   * authors read & manage chapters of novels they own
--   * admin/superadmin manage all
-- ---------------------------------------------------------------------
drop policy if exists "chapters: public read published" on public.chapters;
drop policy if exists "chapters: author read own"       on public.chapters;
drop policy if exists "chapters: author write own"      on public.chapters;
drop policy if exists "chapters: admin all"             on public.chapters;

create policy "chapters: public read published"
  on public.chapters for select
  using (
    status = 'published'
    and exists (
      select 1 from public.novels n
      where n.id = chapters.novel_id and n.status = 'published'
    )
  );

create policy "chapters: author read own"
  on public.chapters for select
  using (
    exists (
      select 1 from public.novels n
      join public.authors a on a.id = n.author_id
      where n.id = chapters.novel_id and a.profile_id = auth.uid()
    )
  );

create policy "chapters: author write own"
  on public.chapters for all
  using (
    exists (
      select 1 from public.novels n
      join public.authors a on a.id = n.author_id
      where n.id = chapters.novel_id and a.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.novels n
      join public.authors a on a.id = n.author_id
      where n.id = chapters.novel_id and a.profile_id = auth.uid()
    )
  );

create policy "chapters: admin all"
  on public.chapters for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- banners policies
--   * public reads only active banners
--   * admin/superadmin manage all
-- ---------------------------------------------------------------------
drop policy if exists "banners: public read active" on public.banners;
drop policy if exists "banners: admin all"          on public.banners;

create policy "banners: public read active"
  on public.banners for select
  using (active = true);

create policy "banners: admin all"
  on public.banners for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- site_settings policies
--   * public read (used by frontend to load logo / footer / etc.)
--   * admin/superadmin write
-- ---------------------------------------------------------------------
drop policy if exists "site_settings: public select" on public.site_settings;
drop policy if exists "site_settings: admin write"   on public.site_settings;

create policy "site_settings: public select"
  on public.site_settings for select
  using (true);

create policy "site_settings: admin write"
  on public.site_settings for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- bookmarks policies (per-user private)
-- ---------------------------------------------------------------------
drop policy if exists "bookmarks: owner all"       on public.bookmarks;
drop policy if exists "bookmarks: superadmin read" on public.bookmarks;

create policy "bookmarks: owner all"
  on public.bookmarks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bookmarks: superadmin read"
  on public.bookmarks for select
  using (public.is_superadmin());

-- ---------------------------------------------------------------------
-- reading_history policies (per-user private)
-- ---------------------------------------------------------------------
drop policy if exists "reading_history: owner all"       on public.reading_history;
drop policy if exists "reading_history: superadmin read" on public.reading_history;

create policy "reading_history: owner all"
  on public.reading_history for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reading_history: superadmin read"
  on public.reading_history for select
  using (public.is_superadmin());
