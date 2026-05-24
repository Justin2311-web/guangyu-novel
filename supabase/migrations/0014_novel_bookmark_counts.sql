-- =====================================================================
-- 光羽小说 — Phase 6e: novel discovery (collection ranking)
--
--   The 收藏榜 (collection ranking) needs per-novel bookmark counts, but
--   bookmarks RLS is owner-only, so the public cannot aggregate them. This
--   adds ONE additive SECURITY DEFINER function that returns COUNTS ONLY
--   (never user ids) for published novels. No RLS policy, table, column, or
--   existing function is modified.
-- =====================================================================

create or replace function public.novel_bookmark_counts()
returns table (novel_id uuid, bookmark_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select b.novel_id, count(*)::bigint
  from public.bookmarks b
  join public.novels n on n.id = b.novel_id and n.is_published = true
  group by b.novel_id;
$$;

revoke all on function public.novel_bookmark_counts() from public;
grant execute on function public.novel_bookmark_counts() to anon, authenticated;
