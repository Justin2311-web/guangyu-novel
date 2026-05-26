-- =====================================================================
-- 光羽小说 — Phase 6m (Part 1): optional secondary category on novels
--
--   Adds novels.secondary_category_id as a PLAIN uuid column (intentionally
--   WITHOUT a foreign key to categories). A second FK to categories would
--   make every existing PostgREST `categories(...)` embed ambiguous and
--   break production reads, so we avoid the FK and resolve the secondary
--   category name in application code. Fully additive + idempotent; existing
--   single-category novels keep working (secondary stays null).
-- =====================================================================

alter table public.novels
  add column if not exists secondary_category_id uuid;

-- Helps the "primary OR secondary = X" category filter.
create index if not exists novels_secondary_category_idx
  on public.novels(secondary_category_id)
  where secondary_category_id is not null;
