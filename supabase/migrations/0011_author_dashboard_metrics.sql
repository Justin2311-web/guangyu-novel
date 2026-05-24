-- =====================================================================
-- 光羽小说 — Phase 6b: author analytics metrics
--
--   Two analytics figures cross *other* users' rows that the owner-only RLS
--   on bookmarks / reading_history correctly hides from an author:
--     * total bookshelf saves on the author's novels
--     * reads in the last 7 days on the author's novels
--
--   This adds ONE additive SECURITY DEFINER function that returns only those
--   two aggregate counts for the *calling* author's own novels (scoped by
--   auth.uid()). It exposes no reader identities and changes no RLS policy.
--   Fully additive — no table, column, or policy is modified.
-- =====================================================================

create or replace function public.author_dashboard_metrics()
returns table (bookshelf_saves bigint, views_last_7_days bigint)
language sql
security definer
set search_path = public
as $$
  with my_novels as (
    select n.id
    from public.novels n
    join public.authors a on a.id = n.author_id
    where a.profile_id = auth.uid()
  )
  select
    (select count(*) from public.bookmarks b
       where b.novel_id in (select id from my_novels))::bigint,
    (select count(*) from public.reading_history rh
       where rh.novel_id in (select id from my_novels)
         and rh.last_read_at >= now() - interval '7 days')::bigint;
$$;

revoke all on function public.author_dashboard_metrics() from public;
grant execute on function public.author_dashboard_metrics() to authenticated;
