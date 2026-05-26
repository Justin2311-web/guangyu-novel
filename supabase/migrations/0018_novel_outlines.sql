-- =====================================================================
-- 光羽小说 — Phase 6m (Part 2): private author outline system
--
--   New table public.novel_outlines for author story-planning notes
--   (worldview, plotlines, characters, foreshadowing, unresolved hooks,
--   timeline, etc). Private to the owning author + admins; never public.
--   Fully additive + idempotent. No existing table/policy is modified.
-- =====================================================================

create table if not exists public.novel_outlines (
  id           uuid primary key default gen_random_uuid(),
  novel_id     uuid not null references public.novels(id) on delete cascade,
  author_id    uuid references public.authors(id) on delete set null,
  section_type text not null
                 check (section_type in (
                   'worldview', 'plotline', 'protagonist', 'character',
                   'faction', 'location', 'foreshadowing', 'unresolved_hook',
                   'timeline', 'note'
                 )),
  title        text not null,
  content      text,
  status       text not null default 'active'
                 check (status in ('active', 'resolved', 'archived')),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists novel_outlines_novel_idx
  on public.novel_outlines(novel_id, section_type, sort_order);

drop trigger if exists novel_outlines_set_updated_at on public.novel_outlines;
create trigger novel_outlines_set_updated_at
  before update on public.novel_outlines
  for each row execute function public.set_updated_at();

alter table public.novel_outlines enable row level security;

-- ---------------------------------------------------------------------
-- RLS: outline rows are private to the owning author (via the novel's
-- author -> profile chain). Admin/superadmin may manage. No public read.
-- ---------------------------------------------------------------------
drop policy if exists "outlines: owner all" on public.novel_outlines;
drop policy if exists "outlines: admin all" on public.novel_outlines;

create policy "outlines: owner all"
  on public.novel_outlines for all
  using (
    exists (
      select 1
      from public.novels n
      join public.authors a on a.id = n.author_id
      where n.id = novel_outlines.novel_id
        and a.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.novels n
      join public.authors a on a.id = n.author_id
      where n.id = novel_outlines.novel_id
        and a.profile_id = auth.uid()
    )
  );

create policy "outlines: admin all"
  on public.novel_outlines for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());
