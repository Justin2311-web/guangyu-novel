-- =====================================================================
-- 光羽小说 — Phase 6c: novel comments & reader interaction
--
--   New table public.comments with its own RLS. Nothing else is modified —
--   no existing table, column, policy, or function changes.
--
--   Design note: profiles RLS hides other users' display_name from the
--   public, so the commenter name is denormalized onto each comment row
--   (user_display_name) at insert time. This lets anonymous visitors render
--   the comment list without weakening the profiles policies.
-- =====================================================================

create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  novel_id          uuid not null references public.novels(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  user_display_name text,
  content           text not null,
  status            text not null default 'visible'
                      check (status in ('visible', 'hidden', 'deleted')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists comments_novel_idx on public.comments(novel_id, created_at desc);
create index if not exists comments_user_idx  on public.comments(user_id);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

-- ---------------------------------------------------------------------
-- comments policies
--   * anyone reads visible comments
--   * a user always sees their own (any status)
--   * a user inserts only their own row
--   * a user edits / soft-deletes only their own *visible* comment
--     (cannot override an admin-hidden/deleted one, cannot reassign owner)
--   * admin / superadmin moderate everything
-- ---------------------------------------------------------------------
drop policy if exists "comments: public read visible" on public.comments;
drop policy if exists "comments: owner read own"      on public.comments;
drop policy if exists "comments: owner insert"        on public.comments;
drop policy if exists "comments: owner update visible" on public.comments;
drop policy if exists "comments: admin all"           on public.comments;

create policy "comments: public read visible"
  on public.comments for select
  using (status = 'visible');

create policy "comments: owner read own"
  on public.comments for select
  using (user_id = auth.uid());

create policy "comments: owner insert"
  on public.comments for insert
  with check (user_id = auth.uid());

create policy "comments: owner update visible"
  on public.comments for update
  using (user_id = auth.uid() and status = 'visible')
  with check (user_id = auth.uid());

create policy "comments: admin all"
  on public.comments for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());
