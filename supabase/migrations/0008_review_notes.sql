-- =====================================================================
-- 光羽小说 — Phase 5b: review center
--
-- Adds a reviewer note to novels and chapters so the admin review center can
-- record a rejection reason that authors see in the author portal.
--
-- "Approve" reuses the existing published state (novels: review_status =
-- 'published' + is_published = true; chapters: status = 'published'), matching
-- the existing public-read RLS — no new enum value is introduced.
--
-- Idempotent: only adds columns/indexes if missing.
-- =====================================================================

alter table public.novels
  add column if not exists review_note text;

alter table public.chapters
  add column if not exists review_note text;

create index if not exists novels_review_status_idx on public.novels(review_status);
create index if not exists chapters_review_idx on public.chapters(status);
