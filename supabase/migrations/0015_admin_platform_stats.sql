-- =====================================================================
-- 光羽小说 — Phase 6h: admin dashboard platform stats
--
--   One additive SECURITY DEFINER function returning COUNTS ONLY for the
--   admin overview. It is gated to admin/superadmin (raises otherwise) and
--   exposes no private user data — only aggregate numbers. This is needed
--   because bookmarks / reading_history are superadmin-read-only under RLS,
--   so a regular admin cannot otherwise total them; bundling every count in
--   one call also avoids ~20 client round-trips.
--
--   No table, column, RLS policy, or existing function is modified.
-- =====================================================================

create or replace function public.admin_platform_stats()
returns table (
  total_novels            bigint,
  published_novels        bigint,
  draft_novels            bigint,
  pending_novels          bigint,
  rejected_novels         bigint,
  total_chapters          bigint,
  published_chapters      bigint,
  pending_chapters        bigint,
  total_users             bigint,
  readers                 bigint,
  authors                 bigint,
  admins                  bigint,
  suspended_users         bigint,
  deleted_users           bigint,
  total_comments          bigint,
  visible_comments        bigint,
  hidden_deleted_comments bigint,
  total_bookmarks         bigint,
  total_reading_history   bigint,
  total_views             bigint,
  pending_applications    bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_or_higher() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.novels),
    (select count(*) from public.novels where review_status = 'published'),
    (select count(*) from public.novels where review_status = 'draft'),
    (select count(*) from public.novels where review_status = 'pending_review'),
    (select count(*) from public.novels where review_status = 'rejected'),
    (select count(*) from public.chapters),
    (select count(*) from public.chapters where status = 'published'),
    (select count(*) from public.chapters where status = 'pending_review'),
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where role = 'reader'),
    (select count(*) from public.profiles where role = 'author'),
    (select count(*) from public.profiles where role in ('admin', 'superadmin')),
    (select count(*) from public.profiles where suspended = true),
    (select count(*) from public.profiles where deleted_at is not null),
    (select count(*) from public.comments),
    (select count(*) from public.comments where status = 'visible'),
    (select count(*) from public.comments where status in ('hidden', 'deleted')),
    (select count(*) from public.bookmarks),
    (select count(*) from public.reading_history),
    (select coalesce(sum(view_count), 0) from public.novels),
    (select count(*) from public.author_applications where status = 'pending');
end;
$$;

revoke all on function public.admin_platform_stats() from public;
grant execute on function public.admin_platform_stats() to authenticated;
