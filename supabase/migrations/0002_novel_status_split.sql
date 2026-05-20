-- =====================================================================
-- 光羽小说 — Phase 3b: split novel status into serialization + visibility
--
-- Phase 1 used novels.status (enum: draft/pending_review/published/...)
-- as a combined review + visibility flag. Phase 3b separates concerns:
--
--   * status        -> serialization state (ongoing / completed / hiatus)
--   * is_published  -> public visibility flag
--   * review_status -> the original review workflow (kept for Phase 4)
--
-- Also renames cover_url -> cover_image_url.
-- =====================================================================

-- 1. New serialization-status enum.
do $$ begin
  create type public.novel_serial_status as enum ('ongoing', 'completed', 'hiatus');
exception when duplicate_object then null; end $$;

-- 2. Preserve the original review workflow under a new name.
--    (Postgres auto-rewrites policy expressions that reference this column;
--     we drop & recreate the affected policies below to be explicit.)
alter table public.novels rename column status to review_status;

-- 3. Add the serialization status column.
alter table public.novels
  add column if not exists status public.novel_serial_status not null default 'ongoing';

-- 4. Add the publish/visibility flag and backfill from the old workflow.
alter table public.novels
  add column if not exists is_published boolean not null default false;

update public.novels set is_published = true where review_status = 'published';

-- 5. Rename the cover column.
alter table public.novels rename column cover_url to cover_image_url;

-- 6. Helpful index for the public "latest published" query.
create index if not exists novels_published_idx
  on public.novels (is_published, created_at desc);

-- =====================================================================
-- RLS — public visibility now keys off is_published, not status.
-- =====================================================================

-- novels: public reads published novels
drop policy if exists "novels: public read published" on public.novels;
create policy "novels: public read published"
  on public.novels for select
  using (is_published = true);

-- chapters: public reads published chapters whose novel is published
drop policy if exists "chapters: public read published" on public.chapters;
create policy "chapters: public read published"
  on public.chapters for select
  using (
    status = 'published'
    and exists (
      select 1 from public.novels n
      where n.id = chapters.novel_id and n.is_published = true
    )
  );
